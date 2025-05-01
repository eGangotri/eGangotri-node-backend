import * as fsPromise from 'fs/promises';
import path from 'path';
import { getDirectories, getDirectoriesWithFullPath, formatTime } from '../Utils';

// Mock fs/promises
jest.mock('fs/promises');

describe('Utils', () => {
  describe('getDirectories', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return directory names', async () => {
      // Mock data
      const mockDirents = [
        { name: 'dir1', isDirectory: () => true },
        { name: 'file1.txt', isDirectory: () => false },
        { name: 'dir2', isDirectory: () => true }
      ];

      // Setup mock
      (fsPromise.readdir as jest.Mock).mockResolvedValue(mockDirents);

      // Execute
      const result = await getDirectories('/test/path');

      // Assert
      expect(fsPromise.readdir).toHaveBeenCalledWith('/test/path', { withFileTypes: true });
      expect(result).toEqual(['dir1', 'dir2']);
    });

    it('should handle empty directory', async () => {
      // Setup mock
      (fsPromise.readdir as jest.Mock).mockResolvedValue([]);

      // Execute
      const result = await getDirectories('/empty/path');

      // Assert
      expect(fsPromise.readdir).toHaveBeenCalledWith('/empty/path', { withFileTypes: true });
      expect(result).toEqual([]);
    });

    it('should handle directory with no subdirectories', async () => {
      // Mock data
      const mockDirents = [
        { name: 'file1.txt', isDirectory: () => false },
        { name: 'file2.txt', isDirectory: () => false }
      ];

      // Setup mock
      (fsPromise.readdir as jest.Mock).mockResolvedValue(mockDirents);

      // Execute
      const result = await getDirectories('/no/dirs/path');

      // Assert
      expect(fsPromise.readdir).toHaveBeenCalledWith('/no/dirs/path', { withFileTypes: true });
      expect(result).toEqual([]);
    });
  });

  describe('getDirectoriesWithFullPath', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return full directory paths', async () => {
      // Mock data
      const mockDirents = [
        { name: 'dir1', isDirectory: () => true },
        { name: 'file1.txt', isDirectory: () => false },
        { name: 'dir2', isDirectory: () => true }
      ];

      const sourcePath = '/test/path';

      // Setup mock
      (fsPromise.readdir as jest.Mock).mockResolvedValue(mockDirents);

      // Execute
      const result = await getDirectoriesWithFullPath(sourcePath);

      // Assert
      expect(fsPromise.readdir).toHaveBeenCalledWith(sourcePath, { withFileTypes: true });
      expect(result).toEqual([
        `${sourcePath}\\dir1`,
        `${sourcePath}\\dir2`
      ]);
    });

    it('should handle empty directory', async () => {
      // Setup mock
      (fsPromise.readdir as jest.Mock).mockResolvedValue([]);

      // Execute
      const result = await getDirectoriesWithFullPath('/empty/path');

      // Assert
      expect(fsPromise.readdir).toHaveBeenCalledWith('/empty/path', { withFileTypes: true });
      expect(result).toEqual([]);
    });
  });

  describe('formatTime', () => {
    it('should format time in seconds', () => {
      const result = formatTime(5000); // 5 seconds
      expect(result).toBe('5.00 sec(s)');
    });

    it('should format time in minutes', () => {
      const result = formatTime(120000); // 2 minutes
      expect(result).toBe('2.00 min(s)');
    });

    it('should format time in hours', () => {
      const result = formatTime(7200000); // 2 hours
      expect(result).toBe('2.00 hour(s)');
    });

    it('should handle very small time values', () => {
      const result = formatTime(100); // 0.1 seconds
      expect(result).toBe('0.10 sec(s)');
    });
  });
});
