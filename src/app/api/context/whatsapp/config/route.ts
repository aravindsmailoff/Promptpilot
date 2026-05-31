import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const configPath = path.join(process.cwd(), 'whatsapp-config.json');

function getDefaultConfig() {
  return {
    autoReplyUnknown: true,
    autoReplyGroups: false,
    selectedContacts: [] as string[],
    knownContacts: [] as string[]
  };
}

export async function GET() {
  try {
    if (!fs.existsSync(configPath)) {
      fs.writeFileSync(configPath, JSON.stringify(getDefaultConfig(), null, 2));
    }
    const data = fs.readFileSync(configPath, 'utf8');
    return NextResponse.json({ ...getDefaultConfig(), ...JSON.parse(data) });
  } catch (err: any) {
    return NextResponse.json(getDefaultConfig());
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const config = {
      autoReplyUnknown: body.autoReplyUnknown ?? true,
      autoReplyGroups: body.autoReplyGroups ?? false,
      selectedContacts: Array.isArray(body.selectedContacts) ? body.selectedContacts : [],
      knownContacts: Array.isArray(body.knownContacts) ? body.knownContacts : []
    };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return NextResponse.json({ success: true, config });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
