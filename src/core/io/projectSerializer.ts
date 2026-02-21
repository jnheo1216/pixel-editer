import {
  MAX_LAYER_COUNT,
  sanitizeDocument,
  type LayerModel,
  type PixelDocument,
  type ProjectFileV1,
} from '../model/types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function assertFiniteNumber(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${label} 값이 올바르지 않습니다.`);
  }

  return value;
}

function assertString(value: unknown, label: string): string {
  if (typeof value !== 'string') {
    throw new Error(`${label} 값이 올바르지 않습니다.`);
  }

  return value;
}

export function documentToProjectFile(pixelDocument: PixelDocument): ProjectFileV1 {
  return {
    version: 1,
    document: {
      width: pixelDocument.width,
      height: pixelDocument.height,
      pixelSize: pixelDocument.pixelSize,
      activeLayerId: pixelDocument.activeLayerId,
      layers: pixelDocument.layers.map((layer) => ({
        id: layer.id,
        name: layer.name,
        visible: layer.visible,
        pixels: Array.from(layer.pixels),
      })),
    },
  };
}

function projectLayersToModels(
  width: number,
  height: number,
  rawLayers: unknown,
): LayerModel[] {
  if (!Array.isArray(rawLayers)) {
    throw new Error('레이어 정보가 올바르지 않습니다.');
  }

  const expectedLength = width * height;

  return rawLayers.slice(0, MAX_LAYER_COUNT).map((layerValue, layerIndex) => {
    if (!isRecord(layerValue)) {
      throw new Error(`레이어 ${layerIndex + 1} 정보가 올바르지 않습니다.`);
    }

    const id = assertString(layerValue.id, `레이어 ${layerIndex + 1} id`);
    const name = assertString(layerValue.name, `레이어 ${layerIndex + 1} 이름`);
    const visible = Boolean(layerValue.visible);

    if (!Array.isArray(layerValue.pixels)) {
      throw new Error(`레이어 ${layerIndex + 1} 픽셀 데이터가 없습니다.`);
    }

    const typedPixels = new Uint32Array(expectedLength);

    for (let i = 0; i < expectedLength; i += 1) {
      const raw = layerValue.pixels[i] ?? 0;
      const color = assertFiniteNumber(raw, `레이어 ${layerIndex + 1} 픽셀`);
      typedPixels[i] = color >>> 0;
    }

    return {
      id,
      name,
      visible,
      pixels: typedPixels,
    };
  });
}

export function projectFileToDocument(project: ProjectFileV1): PixelDocument {
  const width = project.document.width;
  const height = project.document.height;

  const nextDocument: PixelDocument = {
    width,
    height,
    pixelSize: project.document.pixelSize,
    activeLayerId: project.document.activeLayerId,
    layers: project.document.layers.map((layer) => ({
      id: layer.id,
      name: layer.name,
      visible: layer.visible,
      pixels: Uint32Array.from(layer.pixels),
    })),
  };

  return sanitizeDocument(nextDocument);
}

export function parseProjectFile(raw: string): ProjectFileV1 {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    throw new Error('JSON 형식이 올바르지 않습니다.');
  }

  if (!isRecord(parsed)) {
    throw new Error('프로젝트 파일 구조가 올바르지 않습니다.');
  }

  if (parsed.version !== 1) {
    throw new Error('지원하지 않는 프로젝트 버전입니다.');
  }

  if (!isRecord(parsed.document)) {
    throw new Error('문서 정보가 없습니다.');
  }

  const width = assertFiniteNumber(parsed.document.width, '너비');
  const height = assertFiniteNumber(parsed.document.height, '높이');
  const pixelSize = assertFiniteNumber(parsed.document.pixelSize, '픽셀 크기');
  const activeLayerId = assertString(parsed.document.activeLayerId, '활성 레이어 ID');

  const layerModels = projectLayersToModels(width, height, parsed.document.layers);

  return {
    version: 1,
    document: {
      width,
      height,
      pixelSize,
      activeLayerId,
      layers: layerModels.map((layer) => ({
        id: layer.id,
        name: layer.name,
        visible: layer.visible,
        pixels: Array.from(layer.pixels),
      })),
    },
  };
}

export function serializeProjectFile(project: ProjectFileV1): string {
  return JSON.stringify(project, null, 2);
}
