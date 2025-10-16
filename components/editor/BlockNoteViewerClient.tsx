"use client";

import dynamic from "next/dynamic";

const BlockNoteViewer = dynamic(() => import("./BlockNoteViewer"), { ssr: false });

export default BlockNoteViewer;


