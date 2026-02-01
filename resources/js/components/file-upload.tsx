import React, { useState, useRef, DragEvent, ChangeEvent, useEffect } from 'react';
import { X, Upload, FileText, FileImage, FileVideo, File as FileIcon, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

// File type icons mapping
const FILE_TYPE_ICONS = {
    'application/pdf': FileText,
    'text/csv': FileText,
    'application/vnd.ms-excel': FileText,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': FileText,
    'application/msword': FileText,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': FileText,
    'text/plain': FileText,
    'image': FileImage,
    'video': FileVideo,
    'default': FileIcon,
};

interface ExistingFile {
    id: number | string;
    path: string;
    url: string;
    mime_type: string;
    name?: string;
    size?: number;
}

interface FilePreview {
    file: File;
    preview: string;
    type: 'image' | 'video' | 'other';
}

interface FileUploadProps {
    value?: File | File[] | null;
    onChange: (files: File | File[] | null) => void;
    existingFiles?: ExistingFile[];
    onRemoveExisting?: (fileId: number | string) => void;
    multiple?: boolean;
    accept?: string;
    maxSize?: number; // in MB
    maxFiles?: number;
    disabled?: boolean;
    className?: string;
    error?: string;
}

export default function FileUpload({
    value,
    onChange,
    existingFiles = [],
    onRemoveExisting,
    multiple = false,
    accept,
    maxSize = 10,
    maxFiles,
    disabled = false,
    className,
    error,
}: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [filePreviews, setFilePreviews] = useState<FilePreview[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Convert File to preview
    const createFilePreview = (file: File): Promise<FilePreview> => {
        return new Promise((resolve) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const result = e.target?.result as string;
                let type: 'image' | 'video' | 'other' = 'other';

                if (file.type.startsWith('image/')) {
                    type = 'image';
                } else if (file.type.startsWith('video/')) {
                    type = 'video';
                }

                resolve({
                    file,
                    preview: result,
                    type,
                });
            };

            if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
                reader.readAsDataURL(file);
            } else {
                resolve({
                    file,
                    preview: '',
                    type: 'other',
                });
            }
        });
    };

    // Process files
    const processFiles = async (files: FileList | File[]) => {
        const fileArray = Array.from(files);

        // Validate file size
        const validFiles = fileArray.filter(file => {
            const sizeMB = file.size / (1024 * 1024);
            return sizeMB <= maxSize;
        });

        if (validFiles.length !== fileArray.length) {
            alert(`Some files exceed the ${maxSize}MB size limit and were not added.`);
        }

        // Respect maxFiles limit
        let filesToProcess = validFiles;
        if (maxFiles && !multiple) {
            filesToProcess = validFiles.slice(0, 1);
        } else if (maxFiles) {
            const currentCount = (Array.isArray(value) ? value.length : value ? 1 : 0) + existingFiles.length;
            const remaining = maxFiles - currentCount;
            filesToProcess = validFiles.slice(0, remaining);

            if (validFiles.length > remaining) {
                alert(`Maximum ${maxFiles} files allowed. Only first ${remaining} files were added.`);
            }
        }

        // Create previews
        const previews = await Promise.all(filesToProcess.map(createFilePreview));

        if (multiple) {
            const currentFiles = Array.isArray(value) ? value : value ? [value] : [];
            const newFiles = [...currentFiles, ...filesToProcess];
            setFilePreviews([...filePreviews, ...previews]);
            onChange(newFiles);
        } else {
            setFilePreviews(previews);
            onChange(filesToProcess[0] || null);
        }
    };

    // Handle file input change
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            processFiles(files);
        }
        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Handle drag and drop
    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (!disabled && e.dataTransfer.files) {
            processFiles(e.dataTransfer.files);
        }
    };

    // Remove new file
    const handleRemoveFile = (index: number) => {
        if (multiple) {
            const currentFiles = Array.isArray(value) ? value : [];
            const newFiles = currentFiles.filter((_, i) => i !== index);
            const newPreviews = filePreviews.filter((_, i) => i !== index);
            setFilePreviews(newPreviews);
            onChange(newFiles.length > 0 ? newFiles : null);
        } else {
            setFilePreviews([]);
            onChange(null);
        }
    };

    // Get icon for file type
    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith('image/')) {
            return FILE_TYPE_ICONS['image'];
        } else if (mimeType.startsWith('video/')) {
            return FILE_TYPE_ICONS['video'];
        } else if (FILE_TYPE_ICONS[mimeType as keyof typeof FILE_TYPE_ICONS]) {
            return FILE_TYPE_ICONS[mimeType as keyof typeof FILE_TYPE_ICONS];
        }
        return FILE_TYPE_ICONS['default'];
    };

    // Format file size
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const showUploadArea = (!multiple && filePreviews.length === 0 && existingFiles.length === 0) ||
        (multiple && (!maxFiles || (filePreviews.length + existingFiles.length) < maxFiles));


    useEffect(() => {
        if (!value) {
            setFilePreviews([]);
        } else if (!multiple && value instanceof File) {
            // If a single file exists but previews are empty (e.g. manual state set)
            // This part is optional but helps keep things in sync
            if (filePreviews.length === 0) {
                createFilePreview(value).then(preview => setFilePreviews([preview]));
            }
        }
    }, [value]);

    return (
        <div className={cn('w-full', className)}>
            {/* Upload Area */}
            {showUploadArea && (
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => !disabled && fileInputRef.current?.click()}
                    className={cn(
                        'border-2 border-dashed rounded-lg transition-all cursor-pointer',
                        'hover:border-primary hover:bg-accent/50',
                        'dark:border-gray-700 dark:hover:border-primary',
                        isDragging && 'border-primary bg-accent/50 scale-[1.02]',
                        disabled && 'opacity-50 cursor-not-allowed',
                        error && 'border-red-500',
                        !multiple && filePreviews.length === 0 ? 'p-12' : 'p-6'
                    )}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileChange}
                        multiple={multiple}
                        accept={accept}
                        disabled={disabled}
                        className="hidden"
                    />

                    <div className="flex flex-col items-center justify-center text-center">
                        <div className={cn(
                            'rounded-full p-4 mb-4',
                            'bg-primary/10 dark:bg-primary/20'
                        )}>
                            <Upload className="w-8 h-8 text-primary" />
                        </div>

                        <p className="text-sm font-medium mb-1 dark:text-gray-200">
                            <span className="text-primary cursor-pointer hover:underline">Click to upload</span>
                            {' '}or drag and drop
                        </p>

                        <p className="text-xs text-muted-foreground dark:text-gray-400">
                            {accept ? `Accepted: ${accept}` : 'Any file type'}
                            {maxSize && ` • Max ${maxSize}MB`}
                            {maxFiles && multiple && ` • Up to ${maxFiles} files`}
                        </p>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <p className="text-sm text-red-500 mt-2">{error}</p>
            )}

            {/* Preview Section */}
            {(existingFiles.length > 0 || filePreviews.length > 0) && (
                <div className={cn(
                    'border-2 border-dashed rounded-lg p-4 mt-4',
                    'dark:border-gray-700',
                    error && 'border-red-500'
                )}>
                    {/* Existing Files */}
                    {existingFiles.length > 0 && (
                        <div className="mb-4">
                            <h3 className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
                                Existing Files
                            </h3>
                            <div className={cn(
                                'grid gap-4',
                                multiple ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'
                            )}>
                                {existingFiles.map((file) => {
                                    const isImage = file.mime_type.startsWith('image/');
                                    const isVideo = file.mime_type.startsWith('video/');
                                    const Icon = getFileIcon(file.mime_type);

                                    return (
                                        <div
                                            key={file.id}
                                            className="relative group border rounded-lg overflow-hidden bg-white dark:bg-gray-800 dark:border-gray-700"
                                        >
                                            {/* Preview */}
                                            <div className="aspect-video bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                                                {isImage ? (
                                                    <img
                                                        src={file.url}
                                                        alt={file.name || 'File'}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : isVideo ? (
                                                    <video
                                                        src={file.url}
                                                        className="w-full h-full object-cover"
                                                        controls
                                                    />
                                                ) : (
                                                    <Icon className="w-12 h-12 text-gray-400 dark:text-gray-600" />
                                                )}
                                            </div>

                                            {/* File Info */}
                                            <div className="p-2">
                                                <p className="text-xs font-medium truncate dark:text-gray-200">
                                                    {file.name || file.path.split('/').pop()}
                                                </p>
                                                {file.size && (
                                                    <p className="text-xs text-muted-foreground dark:text-gray-400">
                                                        {formatFileSize(file.size)}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Remove Button */}
                                            {onRemoveExisting && (
                                                <button
                                                    type="button"
                                                    onClick={() => onRemoveExisting(file.id)}
                                                    className={cn(
                                                        'absolute top-2 right-2 p-1.5 rounded-full',
                                                        'bg-red-500 text-white opacity-0 group-hover:opacity-100',
                                                        'transition-opacity hover:bg-red-600'
                                                    )}
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* New Files */}
                    {filePreviews.length > 0 && (
                        <div>
                            {existingFiles.length > 0 && (
                                <h3 className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
                                    New Files
                                </h3>
                            )}
                            <div className={cn(
                                'grid gap-4',
                                multiple ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'
                            )}>
                                {filePreviews.map((preview, index) => {
                                    const Icon = getFileIcon(preview.file.type);

                                    return (
                                        <div
                                            key={index}
                                            className="relative group border rounded-lg overflow-hidden bg-white dark:bg-gray-800 dark:border-gray-700"
                                        >
                                            {/* Preview */}
                                            <div className="aspect-video bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                                                {preview.type === 'image' ? (
                                                    <img
                                                        src={preview.preview}
                                                        alt={preview.file.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : preview.type === 'video' ? (
                                                    <video
                                                        src={preview.preview}
                                                        className="w-full h-full object-cover"
                                                        controls
                                                    />
                                                ) : (
                                                    <Icon className="w-12 h-12 text-gray-400 dark:text-gray-600" />
                                                )}
                                            </div>

                                            {/* File Info */}
                                            <div className="p-2">
                                                <p className="text-xs font-medium truncate dark:text-gray-200">
                                                    {preview.file.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground dark:text-gray-400">
                                                    {formatFileSize(preview.file.size)}
                                                </p>
                                            </div>

                                            {/* Remove Button */}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveFile(index)}
                                                className={cn(
                                                    'absolute top-2 right-2 p-1.5 rounded-full',
                                                    'bg-red-500 text-white opacity-0 group-hover:opacity-100',
                                                    'transition-opacity hover:bg-red-600'
                                                )}
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}