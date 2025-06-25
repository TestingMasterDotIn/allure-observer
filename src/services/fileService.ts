import { BehaviorsData, CategoriesData, PackagesData, SuitesData, TimelineData } from '../types/behaviors';
import { 
  parseBehaviorsJson, 
  parseCategoriesJson, 
  parsePackagesJson, 
  parseSuitesJson, 
  parseTimelineJson 
} from '../utils/parseBehaviors';

declare global {
  interface Window {
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
  }
  
  interface FileSystemDirectoryHandle {
    entries(): AsyncIterableIterator<[string, FileSystemDirectoryHandle | FileSystemFileHandle]>;
    getFileHandle(name: string): Promise<FileSystemFileHandle>;
    getDirectoryHandle(name: string): Promise<FileSystemDirectoryHandle>;
    readonly kind: 'directory';
  }
}

export const isFileSystemAccessSupported = (): boolean => {
  return 'showDirectoryPicker' in window && window.location.protocol === 'https:' && window.self === window.top;
};

const findTestFiles = async (
  dirHandle: FileSystemDirectoryHandle,
  path: string = ''
): Promise<{ 
  behaviors: { content: string; path: string }[]; 
  categories: { content: string; path: string }[];
  packages: { content: string; path: string }[];
  suites: { content: string; path: string }[];
  timeline: { content: string; path: string }[];
}> => {
  const behaviors: { content: string; path: string }[] = [];
  const categories: { content: string; path: string }[] = [];
  const packages: { content: string; path: string }[] = [];
  const suites: { content: string; path: string }[] = [];
  const timeline: { content: string; path: string }[] = [];
  
  try {
    console.log(`Scanning directory: ${path || 'root'}`);
    
    for await (const [name, handle] of dirHandle.entries()) {
      const currentPath = path ? `${path}/${name}` : name;
      
      if (handle.kind === 'file') {
        if (name === 'behaviors.json') {
          try {
            const file = await handle.getFile();
            const content = await file.text();
            behaviors.push({ content, path: currentPath });
            console.log(`Found behaviors.json at: ${currentPath}`);
          } catch (error) {
            console.error(`Error reading behaviors.json at ${currentPath}:`, error);
          }
        } else if (name === 'categories.json') {
          try {
            const file = await handle.getFile();
            const content = await file.text();
            categories.push({ content, path: currentPath });
            console.log(`Found categories.json at: ${currentPath}`);
          } catch (error) {
            console.error(`Error reading categories.json at ${currentPath}:`, error);
          }
        } else if (name === 'packages.json') {
          try {
            const file = await handle.getFile();
            const content = await file.text();
            packages.push({ content, path: currentPath });
            console.log(`Found packages.json at: ${currentPath}`);
          } catch (error) {
            console.error(`Error reading packages.json at ${currentPath}:`, error);
          }
        } else if (name === 'suites.json') {
          try {
            const file = await handle.getFile();
            const content = await file.text();
            suites.push({ content, path: currentPath });
            console.log(`Found suites.json at: ${currentPath}`);
          } catch (error) {
            console.error(`Error reading suites.json at ${currentPath}:`, error);
          }
        } else if (name === 'timeline.json') {
          try {
            const file = await handle.getFile();
            const content = await file.text();
            timeline.push({ content, path: currentPath });
            console.log(`Found timeline.json at: ${currentPath}`);
          } catch (error) {
            console.error(`Error reading timeline.json at ${currentPath}:`, error);
          }
        }
      } else if (handle.kind === 'directory') {
        // Recursively search subdirectories
        const subFiles = await findTestFiles(handle, currentPath);
        behaviors.push(...subFiles.behaviors);
        categories.push(...subFiles.categories);
        packages.push(...subFiles.packages);
        suites.push(...subFiles.suites);
        timeline.push(...subFiles.timeline);
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${path}:`, error);
  }
  
  return { behaviors, categories, packages, suites, timeline };
};

export const scanLocalFolder = async (): Promise<{ 
  behaviors: BehaviorsData[]; 
  categories: CategoriesData[];
  packages: PackagesData[];
  suites: SuitesData[];
  timeline: TimelineData[];
}> => {
  try {
    if (!window.showDirectoryPicker) {
      throw new Error('File System Access API not supported. This feature requires a modern browser (Chrome, Edge) and HTTPS.');
    }

    const directoryHandle = await window.showDirectoryPicker();
    const { behaviors: behaviorsFiles, categories: categoriesFiles, packages: packagesFiles, suites: suitesFiles, timeline: timelineFiles } = await findTestFiles(directoryHandle);
    
    console.log(`Found ${behaviorsFiles.length} behaviors.json, ${categoriesFiles.length} categories.json, ${packagesFiles.length} packages.json, ${suitesFiles.length} suites.json, ${timelineFiles.length} timeline.json files`);
    
    const parsedBehaviors: BehaviorsData[] = [];
    const parsedCategories: CategoriesData[] = [];
    const parsedPackages: PackagesData[] = [];
    const parsedSuites: SuitesData[] = [];
    const parsedTimeline: TimelineData[] = [];
    
    for (const file of behaviorsFiles) {
      const parsed = parseBehaviorsJson(file.content);
      if (parsed) {
        parsedBehaviors.push(parsed);
        console.log(`Parsed behaviors.json from: ${file.path}`);
      }
    }

    for (const file of categoriesFiles) {
      const parsed = parseCategoriesJson(file.content);
      if (parsed) {
        parsedCategories.push(parsed);
        console.log(`Parsed categories.json from: ${file.path}`);
      }
    }

    for (const file of packagesFiles) {
      const parsed = parsePackagesJson(file.content);
      if (parsed) {
        parsedPackages.push(parsed);
        console.log(`Parsed packages.json from: ${file.path}`);
      }
    }

    for (const file of suitesFiles) {
      const parsed = parseSuitesJson(file.content);
      if (parsed) {
        parsedSuites.push(parsed);
        console.log(`Parsed suites.json from: ${file.path}`);
      }
    }

    for (const file of timelineFiles) {
      const parsed = parseTimelineJson(file.content);
      if (parsed) {
        parsedTimeline.push(parsed);
        console.log(`Parsed timeline.json from: ${file.path}`);
      }
    }
    
    return { behaviors: parsedBehaviors, categories: parsedCategories, packages: parsedPackages, suites: parsedSuites, timeline: parsedTimeline };
  } catch (error) {
    console.error('Error scanning local folder:', error);
    throw error;
  }
};

// Fallback method for environments where File System Access API is not available
export const uploadBehaviorsFiles = (): Promise<{ 
  behaviors: BehaviorsData[]; 
  categories: CategoriesData[];
  packages: PackagesData[];
  suites: SuitesData[];
  timeline: TimelineData[];
}> => {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.json';
    input.setAttribute('webkitdirectory', '');
    input.setAttribute('directory', '');

    input.onchange = async (event) => {
      try {
        const files = (event.target as HTMLInputElement).files;
        if (!files || files.length === 0) {
          reject(new Error('No files selected'));
          return;
        }

        const behaviorsFiles: { content: string; path: string }[] = [];
        const categoriesFiles: { content: string; path: string }[] = [];
        const packagesFiles: { content: string; path: string }[] = [];
        const suitesFiles: { content: string; path: string }[] = [];
        const timelineFiles: { content: string; path: string }[] = [];        for (const file of Array.from(files)) {
          const content = await file.text();
          const filePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
          
          if (file.name === 'behaviors.json') {
            behaviorsFiles.push({ 
              content, 
              path: filePath 
            });
            console.log(`Found behaviors.json at: ${filePath}`);
          } else if (file.name === 'categories.json') {
            categoriesFiles.push({ 
              content, 
              path: filePath 
            });
            console.log(`Found categories.json at: ${filePath}`);
          } else if (file.name === 'packages.json') {
            packagesFiles.push({ 
              content, 
              path: filePath 
            });
            console.log(`Found packages.json at: ${filePath}`);
          } else if (file.name === 'suites.json') {
            suitesFiles.push({ 
              content, 
              path: filePath 
            });
            console.log(`Found suites.json at: ${filePath}`);
          } else if (file.name === 'timeline.json') {
            timelineFiles.push({ 
              content, 
              path: filePath 
            });
            console.log(`Found timeline.json at: ${filePath}`);
          }
        }

        console.log(`Found ${behaviorsFiles.length} behaviors.json, ${categoriesFiles.length} categories.json, ${packagesFiles.length} packages.json, ${suitesFiles.length} suites.json, ${timelineFiles.length} timeline.json files`);
        
        const parsedBehaviors: BehaviorsData[] = [];
        const parsedCategories: CategoriesData[] = [];
        const parsedPackages: PackagesData[] = [];
        const parsedSuites: SuitesData[] = [];
        const parsedTimeline: TimelineData[] = [];
        
        for (const file of behaviorsFiles) {
          const parsed = parseBehaviorsJson(file.content);
          if (parsed) {
            parsedBehaviors.push(parsed);
            console.log(`Parsed behaviors.json from: ${file.path}`);
          }
        }

        for (const file of categoriesFiles) {
          const parsed = parseCategoriesJson(file.content);
          if (parsed) {
            parsedCategories.push(parsed);
            console.log(`Parsed categories.json from: ${file.path}`);
          }
        }

        for (const file of packagesFiles) {
          const parsed = parsePackagesJson(file.content);
          if (parsed) {
            parsedPackages.push(parsed);
            console.log(`Parsed packages.json from: ${file.path}`);
          }
        }

        for (const file of suitesFiles) {
          const parsed = parseSuitesJson(file.content);
          if (parsed) {
            parsedSuites.push(parsed);
            console.log(`Parsed suites.json from: ${file.path}`);
          }
        }

        for (const file of timelineFiles) {
          const parsed = parseTimelineJson(file.content);
          if (parsed) {
            parsedTimeline.push(parsed);
            console.log(`Parsed timeline.json from: ${file.path}`);
          }
        }
        
        resolve({ behaviors: parsedBehaviors, categories: parsedCategories, packages: parsedPackages, suites: parsedSuites, timeline: parsedTimeline });
      } catch (error) {
        reject(error);
      }
    };

    input.onerror = () => reject(new Error('File selection failed'));
    input.click();
  });
};
