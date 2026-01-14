import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X, Check, RotateCcw } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';

interface AvatarUploadProps {
    currentAvatar?: string;
    displayName?: string;
    username?: string;
    onAvatarChange: (base64Image: string) => void;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
    return centerCrop(
        makeAspectCrop(
            {
                unit: '%',
                width: 90,
            },
            aspect,
            mediaWidth,
            mediaHeight,
        ),
        mediaWidth,
        mediaHeight,
    );
}

export function AvatarUpload({ currentAvatar, displayName, username, onAvatarChange }: AvatarUploadProps) {
    const [imageSrc, setImageSrc] = useState<string>('');
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const getInitials = (name: string) => {
        return name.substring(0, 2).toUpperCase();
    };

    const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];

            // Check file size (max 2MB)
            if (file.size > MAX_FILE_SIZE) {
                toast({
                    title: "File too large",
                    description: "Please select an image smaller than 2MB",
                    variant: "destructive"
                });
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                return;
            }

            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setImageSrc(reader.result?.toString() || '');
                setIsCropDialogOpen(true);
            });
            reader.readAsDataURL(file);
        }
    };

    const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget;
        setCrop(centerAspectCrop(width, height, 1)); // 1:1 aspect ratio for avatar
    }, []);

    const getCroppedImg = useCallback(async (): Promise<string> => {
        if (!imgRef.current || !completedCrop) {
            return '';
        }

        const image = imgRef.current;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            return '';
        }

        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        // Set canvas size to desired output size (256x256 for avatar)
        const outputSize = 256;
        canvas.width = outputSize;
        canvas.height = outputSize;

        ctx.drawImage(
            image,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
            0,
            0,
            outputSize,
            outputSize
        );

        return canvas.toDataURL('image/jpeg', 0.9);
    }, [completedCrop]);

    const handleCropComplete = async () => {
        const croppedImage = await getCroppedImg();
        if (croppedImage) {
            onAvatarChange(croppedImage);
        }
        setIsCropDialogOpen(false);
        setImageSrc('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleCancel = () => {
        setIsCropDialogOpen(false);
        setImageSrc('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemoveAvatar = () => {
        onAvatarChange('');
    };

    return (
        <div className="flex flex-col items-center gap-4">
            {/* Avatar Preview */}
            <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
                <Avatar className="h-24 w-24 border-4 border-violet-500/30 relative shadow-xl">
                    <AvatarImage src={currentAvatar} />
                    <AvatarFallback className="bg-gradient-to-br from-violet-500/30 to-purple-500/20 text-violet-300 text-2xl font-bold">
                        {displayName ? getInitials(displayName) : username ? getInitials(username) : "U"}
                    </AvatarFallback>
                </Avatar>

                {/* Upload Button Overlay */}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                    <Camera className="h-8 w-8 text-white" />
                </button>
            </div>

            {/* Hidden File Input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onSelectFile}
                className="hidden"
            />

            {/* Action Buttons */}
            <div className="flex gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs border-violet-500/30 hover:bg-violet-500/10 hover:border-violet-500/50"
                >
                    <Upload className="h-3 w-3 mr-1.5" />
                    Upload Photo
                </Button>
                {currentAvatar && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveAvatar}
                        className="text-xs border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
                    >
                        <X className="h-3 w-3 mr-1.5" />
                        Remove
                    </Button>
                )}
            </div>

            {/* Crop Dialog */}
            <Dialog open={isCropDialogOpen} onOpenChange={setIsCropDialogOpen}>
                <DialogContent className="sm:max-w-[500px] bg-zinc-900 border-violet-500/30">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-serif flex items-center gap-2">
                            <Camera className="h-5 w-5 text-violet-400" />
                            Crop Your Photo
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Adjust the crop area to select your profile picture
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex justify-center py-4">
                        {imageSrc && (
                            <ReactCrop
                                crop={crop}
                                onChange={(_, percentCrop) => setCrop(percentCrop)}
                                onComplete={(c) => setCompletedCrop(c)}
                                aspect={1}
                                circularCrop
                                className="max-h-[400px] rounded-lg overflow-hidden"
                            >
                                <img
                                    ref={imgRef}
                                    src={imageSrc}
                                    alt="Crop preview"
                                    onLoad={onImageLoad}
                                    className="max-h-[400px] object-contain"
                                />
                            </ReactCrop>
                        )}
                    </div>

                    <p className="text-sm text-gray-400 text-center">
                        Drag to reposition • Resize from corners
                    </p>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="ghost"
                            onClick={handleCancel}
                            className="text-gray-400 hover:text-white"
                        >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCropComplete}
                            className="bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:opacity-90"
                        >
                            <Check className="h-4 w-4 mr-2" />
                            Apply
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
