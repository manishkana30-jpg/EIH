import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(_req: NextRequest) {
  try {
    revalidatePath("/library");
    return NextResponse.json({
      revalidated: true,
      path: "/library",
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to revalidate library path", details: err?.message },
      { status: 500 }
    );
  }
}
