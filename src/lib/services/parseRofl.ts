// Used https://github.com/fraxiinus/roflxd.cs/blob/master/Rofl.Extract.Data/Readers/RoflReader.cs for reference.

import type { Rofl1Metadata } from "$lib/models/rofl";
import type { Rofl2Metadata } from "$lib/models/rofl2";

export const ROFL_SIGNATURE = new Uint8Array([0x52, 0x49, 0x4F, 0x54, 0x00, 0x00]); //RIOT00
export const ROFL2_SIGNATURE = new Uint8Array([0x52, 0x49, 0x4F, 0x54, 0x02, 0x00]); //RIOT20

type RoflVersion = 1 | 2;

export type ROFL = {
    version: number;
    filename: string;
    gameVersion: string;
    metadata: Rofl1Metadata | Rofl2Metadata;
}

export async function parseRofl(file: File): Promise<ROFL> {
    const arrayBuffer = await file.arrayBuffer();

    // Find the ROFL version signature from bytes 0 to 6
    let rofl_version: RoflVersion;
    const fileSignature = new Uint8Array(arrayBuffer.slice(0, 6));
    
    let gameVersion;
    let metadata;

    if (matchSignature(fileSignature, ROFL_SIGNATURE)) {
        rofl_version = 1;

        // Replay signature is 256 bytes
        const replaySignatureBytes = new Uint8Array(arrayBuffer.slice(6, 262));
        const replaySignature = new TextDecoder('utf-8').decode(replaySignatureBytes);

        // Read length data 26 bytes
        const lengthDataBytes = new Uint8Array(arrayBuffer.slice(262, 288));
        // Map length data to ROFL1_Length type
        const lengthData = {
            Header: new DataView(lengthDataBytes.buffer).getUint16(0, true),
            File: new DataView(lengthDataBytes.buffer).getUint32(2, true),
            MetadataOffset: new DataView(lengthDataBytes.buffer).getUint32(6, true),
            Metadata: new DataView(lengthDataBytes.buffer).getUint32(10, true),
            PayloadHeaderOffset: new DataView(lengthDataBytes.buffer).getUint32(14, true),
            PayloadHeader: new DataView(lengthDataBytes.buffer).getUint32(18, true),
            PayloadOffset: new DataView(lengthDataBytes.buffer).getUint32(22, true),
        };

        // Read metadata
        const metadataBytes = new Uint8Array(arrayBuffer.slice(lengthData.MetadataOffset, lengthData.MetadataOffset + lengthData.Metadata));
        const metadataText = new TextDecoder('utf-8').decode(metadataBytes);
        metadata = JSON.parse(metadataText);
        metadata.statsJson = JSON.parse(metadata.statsJson);

    } else if (matchSignature(fileSignature, ROFL2_SIGNATURE)) {
        rofl_version = 2;

        // Read version number from header
        const gameVersionLength = new DataView(arrayBuffer.slice(14, 15)).getUint8(0);
        const gameVersionBytes = new Uint8Array(arrayBuffer.slice(15, 15 + gameVersionLength));
        gameVersion = new TextDecoder('utf-8').decode(gameVersionBytes);

        // Read last 4 bytes to get metadata length
        const metadataLengthBytes = new Uint8Array(arrayBuffer.slice(arrayBuffer.byteLength - 4));
        const metadataLength = new DataView(metadataLengthBytes.buffer).getInt32(0, true);

        // Read metadata using length value
        const metadataStart = arrayBuffer.byteLength - (metadataLength + 4);
        const metadataBytes = new Uint8Array(arrayBuffer.slice(metadataStart, metadataStart + metadataLength));

        const metadataText = new TextDecoder('utf-8').decode(metadataBytes);
        metadata = JSON.parse(metadataText);
        metadata.statsJson = JSON.parse(metadata.statsJson)
    } else {
        throw new Error(`Invalid ROFL file signature - expected ROFL or ROFL2 signature, got ${fileSignature}`);
    }


    return {
        version: rofl_version,
        filename: file.name,
        gameVersion: gameVersion || metadata.gameVersion,
        metadata
    }
}

function matchSignature(fileSignature: Uint8Array, signature: Uint8Array): boolean {
    return signature.every((byte, index) => byte === fileSignature[index]);
}