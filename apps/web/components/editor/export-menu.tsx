"use client";

import { Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Button } from "@repo/ui/components/button";
import { BlockNoteEditor } from "@blocknote/core";
import { toast } from "sonner";

interface ExportMenuProps {
  editor: any;
  documentTitle: string;
}

export function ExportMenu({ editor, documentTitle }: ExportMenuProps) {

  // 🟢 The Core Download Logic
  const triggerDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Exported as ${filename}`);
  };

  const exportAsMarkdown = async () => {
    try {
      // 1. Ask BlockNote to convert the current blocks to Markdown
      const markdown = await editor.blocksToMarkdownLossy(editor.document);

      // 2. Trigger the download
      const filename = `${documentTitle || "Untitled"}.md`;
      triggerDownload(markdown, filename, "text/markdown");
    } catch (error) {
      toast.error("Failed to export Markdown");
    }
  };

  const exportAsPDF = async () => {
    try {
      toast.loading("Generating PDF...", { id: "pdf-toast" });

      const html2pdf = (await import("html2pdf.js")).default;
      const html = await editor.blocksToHTMLLossy(editor.document);

      const tempDiv = document.createElement("div");

      tempDiv.innerHTML = `
        <style>
          /* Only target elements inside the PDF container */
          #pdf-export-container { 
            --background: #ffffff;
            --foreground: #000000;
            --primary: #0f172a;
            --muted: #f4f4f5;
          }
          
          #pdf-export-container * {
            border-color: #e4e4e7 !important;
          }
          
          #pdf-export-container { 
            background-color: #ffffff !important; 
            color: #000000 !important; 
          }
          
          #pdf-export-container h1, 
          #pdf-export-container h2, 
          #pdf-export-container h3 { 
            color: #000000 !important; 
            margin-bottom: 0.5em; 
          }
          
          #pdf-export-container p, 
          #pdf-export-container li { 
            color: #1a1a1a !important; 
            line-height: 1.6; 
          }
          
          #pdf-export-container .bn-visual-column { 
            border: none !important; 
          }
        </style>

        <div id="pdf-export-container" style="font-family: Helvetica, Arial, sans-serif; padding: 40px; background-color: #ffffff; min-height: 100vh;">
          <h1 style="font-size: 32px; border-bottom: 2px solid #000000; padding-bottom: 10px; margin-bottom: 20px;">
            ${documentTitle || "Untitled"}
          </h1>
          <div style="font-size: 14px;">
            ${html}
          </div>
        </div>
      `;

      const options = {
        margin: 0.5,
        filename: `${documentTitle || "Untitled"}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          // 🟢 ADD THIS: Tells html2canvas to ignore the global oklch stylesheets
          logging: false,
          onclone: (documentClone: any) => {
            // Find all stylesheets and style blocks in the <head>
            const globalStyles = documentClone.querySelectorAll('head style, head link[rel="stylesheet"]');
            // Delete them so html2canvas never sees the 'oklch' variables
            globalStyles.forEach((tag: any) => tag.remove());
          },
        },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      } as const;

      await html2pdf().set(options).from(tempDiv).save();
      toast.success("PDF Downloaded!", { id: "pdf-toast" });
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate PDF. Check console for color errors.");
    }
  };

  const exportAsHTML = async () => {
    try {
      // 1. Ask BlockNote to convert the current blocks to HTML
      const html = await editor.blocksToHTMLLossy(editor.document);

      // Wrap it in standard HTML tags so it renders beautifully in a browser
      const fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${documentTitle || "Untitled"}</title>
          <style>
            body { font-family: sans-serif; max-width: 800px; margin: 40px auto; line-height: 1.6; color: #333; }
            img { max-width: 100%; border-radius: 8px; }
            pre { background: #f4f4f5; padding: 12px; border-radius: 6px; overflow-x: auto; }
            blockquote { border-left: 4px solid #e4e4e7; margin: 0; padding-left: 16px; color: #52525b; }
          </style>
        </head>
        <body>
          <h1>${documentTitle || "Untitled"}</h1>
          ${html}
        </body>
        </html>
      `;

      const filename = `${documentTitle || "Untitled"}.html`;
      triggerDownload(fullHtml, filename, "text/html");
    } catch (error) {
      toast.error("Failed to export HTML");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={exportAsMarkdown} className="cursor-pointer">
          Export as Markdown (.md)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsHTML} className="cursor-pointer">
          Export as HTML (.html)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsPDF} className="cursor-pointer font-medium text-primary">
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}