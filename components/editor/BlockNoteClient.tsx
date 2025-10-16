"use client";

import dynamic from "next/dynamic";

const BlockNoteEditor = dynamic(() => import("./BlockNoteEditor"), { ssr: false });

export default BlockNoteEditor;