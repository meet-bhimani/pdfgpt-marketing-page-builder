import { getPackagePath, fs, path, loadData, updateData, uploadFiles } from "pdfgpt-destack-alpha/build/server";
// import { getPackagePath, fs, path, loadData, updateData, uploadFiles } from "@meet-bhimani/pdfgpt-destack/build/server";
import { NextRequest, NextResponse } from "next/server";

function getQueryParams(req: NextRequest) {
  const url = new URL(req.url);
  const queryParams = Object.fromEntries(url.searchParams.entries());
  return queryParams;
}

export async function GET(req: NextRequest) {
  try {
    const queryParams = getQueryParams(req);
    const result = await handleEditorNew(req, { query: queryParams });

    if (queryParams.type == "theme") {
      const responseBody = await result.clone().json();
      return NextResponse.json(responseBody);
    }

    if (queryParams.type === "asset") {
      const arrayBuffer = await result.arrayBuffer();
      return new NextResponse(arrayBuffer, {
        status: 200,
        headers: { "Content-Type": "image/png" },
      });
    }

    const response = await result.json();
    return new NextResponse(response, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error handling GET request:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const queryParams = getQueryParams(req);

    const result = await handleEditorNew(req, { query: queryParams });

    if (queryParams.type == "theme") {
      const responseBody = await result.clone().json();
      return NextResponse.json(responseBody);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error handling POST request:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function handleDataNew(req: NextRequest) {
  try {
    const queryParams = getQueryParams(req);

    if (req.method === "GET") {
      const data = await loadData(queryParams.path, queryParams.ext || "html");
      return NextResponse.json(data);
    } else if (req.method === "POST") {
      const contentType = req.headers.get("content-type");
      const isMultiPart = contentType?.startsWith("multipart/form-data");

      if (!isMultiPart) {
        const body = req.body;
        await updateData(queryParams.path, queryParams.ext || "html", body);
        return NextResponse.json({});
      }

      const urls = await uploadFiles(req);
      return NextResponse.json(urls);
    }

    return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
  } catch (error) {
    console.error("Error handling data in handleDataNew:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

async function handleAssetNew(req: NextRequest) {
  try {
    if (req.method === "GET") {
      const queryParams = getQueryParams(req);
      const tempAssetPath = path.join(getPackagePath(), queryParams.path);
      const assetPath = tempAssetPath.replace("(rsc)", path.basename(process.cwd()));

      const data = await fs.promises.readFile(assetPath);

      return new NextResponse(data, {
        headers: {
          "Content-Type": "image/png",
          "Content-Length": data.length.toString(),
        },
      });
    }
    return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
  } catch (error) {
    console.error("Error handling asset in handleAssetNew:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

async function handleThemeNew(req: NextRequest) {
  try {
    if (req.method === "GET") {
      const queryParams = getQueryParams(req);
      const themeName = queryParams.name;
      const tempFolderPath = path.join(getPackagePath(), "themes", themeName);
      const folderPath = tempFolderPath.replace("(rsc)", path.basename(process.cwd()));
      const componentNames = await fs.promises
        .readdir(folderPath)
        .then((f: any[]) => f.filter((c) => c !== "index.ts" && !c.startsWith(".")));

      const componentsP = componentNames.map(async (c: any) => {
        const assetPath = path.join(folderPath, c, "index.html");
        const source = await fs.promises.readFile(assetPath, "utf-8");
        return { source, folder: c };
      });
      const components = await Promise.all(componentsP);
      return NextResponse.json(components);
    }
    return NextResponse.json({ error: "Not allowed" }, { status: 405 });
  } catch (error) {
    console.error("Error handling theme in handleThemeNew:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

async function handleEditorNew(req: NextRequest, { query }: { query: any }) {
  try {
    if (query.type === "data") {
      return handleDataNew(req);
    } else if (query.type === "asset") {
      return handleAssetNew(req);
    } else if (query.type === "theme") {
      return handleThemeNew(req);
    }
    return NextResponse.json({ error: "Invalid Type" }, { status: 400 });
  } catch (error) {
    console.error("Error handling editor request:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
