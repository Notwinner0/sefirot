import { materialPalette } from '../icons';
import {
  ImageIcon, MusicIcon, VideoIcon,
  FilePdfIcon, FileWordIcon, FileExcelIcon,
  DatabaseIcon, PackageIcon, ArchiveIcon, ConfigIcon,
  XmlIcon, MarkdownIcon, FileDocumentIcon
} from '../icons';

// Category-based icon mappings
const iconCategories = {
  image: ImageIcon,
  audio: MusicIcon,
  video: VideoIcon,
  pdf: FilePdfIcon,
  word: FileWordIcon,
  excel: FileExcelIcon,
  powerpoint: FileExcelIcon,
  markdown: MarkdownIcon,
  text: FileDocumentIcon,
  xml: XmlIcon,
  config: ConfigIcon,
  package: PackageIcon,
  archive: ArchiveIcon,
  database: DatabaseIcon,
  file: FileDocumentIcon
};

// Category-based color mappings
const colorCategories = {
  image: materialPalette['light-blue-A400'],
  audio: materialPalette['light-green-500'],
  video: materialPalette['purple-500'],
  pdf: materialPalette['red-700'],
  word: materialPalette['blue-500'],
  excel: materialPalette['green-700'],
  markdown: materialPalette['blue-gray-500'],
  text: materialPalette['blue-gray-500'],
  xml: materialPalette['orange-700'],
  config: materialPalette['blue-gray-500'],
  package: materialPalette['blue-500'],
  archive: materialPalette['blue-gray-700'],
  database: materialPalette['blue-500'],
  file: materialPalette['blue-gray-500']
};

// File extension to category mapping
const extensionToCategory: Record<string, string> = {
  // Images
  'png': 'image', 'jpg': 'image', 'jpeg': 'image', 'gif': 'image',
  'svg': 'image', 'ico': 'image', 'webp': 'image', 'bmp': 'image',

  // Audio
  'mp3': 'audio', 'wav': 'audio', 'flac': 'audio', 'aac': 'audio',

  // Video
  'mp4': 'video', 'avi': 'video', 'mov': 'video', 'mkv': 'video',

  // Documents
  'pdf': 'pdf', 'doc': 'word', 'docx': 'word',
  'xls': 'excel', 'xlsx': 'excel', 'ppt': 'powerpoint', 'pptx': 'powerpoint',
  'md': 'markdown', 'markdown': 'markdown', 'txt': 'text',

  // Data
  'json': 'text', 'xml': 'xml', 'yml': 'text', 'yaml': 'text', 'toml': 'text',
  'ini': 'config', 'conf': 'config', 'config': 'config', 'log': 'config',

  // Archives
  'zip': 'archive', 'rar': 'archive', '7z': 'archive', 'tar': 'archive', 'gz': 'archive',

  // Databases
  'sql': 'database', 'db': 'database', 'sqlite': 'database'
};

// Special file name mappings
const specialFiles: Record<string, string> = {
  'package.json': 'package', 'cargo.toml': 'package', 'cargo.lock': 'package',
  'makefile': 'config', 'tsconfig': 'config', 'jsconfig': 'config',
  'readme': 'text', 'license': 'text'
};

export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

export function getIconColorForFile(filename: string): string {
  const extension = getFileExtension(filename);
  const lowerCaseFilename = filename.toLowerCase();

  // Check special file names first
  for (const [pattern, category] of Object.entries(specialFiles)) {
    if (lowerCaseFilename.includes(pattern)) {
      return colorCategories[category as keyof typeof colorCategories] || materialPalette['blue-gray-500'];
    }
  }

  // Check file extensions
  const category = extensionToCategory[extension];
  if (category) {
    return colorCategories[category as keyof typeof colorCategories] || materialPalette['blue-gray-500'];
  }

  return materialPalette['blue-gray-500'];
}

export function getIconForFile(filename: string): any {
  const extension = getFileExtension(filename);
  const lowerCaseFilename = filename.toLowerCase();

  // Check special file names first
  for (const [pattern, category] of Object.entries(specialFiles)) {
    if (lowerCaseFilename.includes(pattern)) {
      return iconCategories[category as keyof typeof iconCategories] || FileDocumentIcon;
    }
  }

  // Check file extensions
  const category = extensionToCategory[extension];
  if (category) {
    return iconCategories[category as keyof typeof iconCategories] || FileDocumentIcon;
  }

  return FileDocumentIcon;
}
