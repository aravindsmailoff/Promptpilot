'use server';

import { parseOffice } from 'officeparser';

export async function parseOfficeFileAction(base64Data: string, fileName: string): Promise<string> {
  try {
    const buffer = Buffer.from(base64Data, 'base64');
    
    // We pass the Buffer directly to parseOffice.
    // It returns the extracted plain text as a string.
    const text = (await parseOffice(buffer)) as any;
    if (typeof text === 'string') {
      return text;
    }
    if (text && typeof text === 'object' && typeof text.text === 'string') {
      return text.text;
    }
    return text ? String(text) : '';
  } catch (error: any) {
    console.error(`[parseOfficeFileAction] Error parsing ${fileName}:`, error);
    throw new Error(`Failed to extract text from ${fileName}: ${error.message || error}`);
  }
}
