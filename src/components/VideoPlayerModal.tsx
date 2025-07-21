"use client";

import Modal from "./ui/Modal";
import { PlaylistVideo } from "@/lib/types";
import { ExternalLink } from "lucide-react";

interface VideoPlayerModalProps {
  video: PlaylistVideo | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function VideoPlayerModal({ video, isOpen, onClose }: VideoPlayerModalProps) {
  if (!video) return null;

  const youtubeUrl = `https://www.youtube.com/watch?v=${video.videoId}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="動画プレビュー">
      <div className="space-y-4">
        {/* Video Player */}
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          <iframe
            src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1&rel=0`}
            title={video.title}
            width="100%"
            height="100%"
            className="absolute inset-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        
        {/* Video Info */}
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h4 className="text-lg font-semibold text-gray-900 flex-1">
              {video.title}
            </h4>
            <span className="text-sm text-gray-500 ml-4">#{video.position}</span>
          </div>
          
          {video.description && (
            <p className="text-sm text-gray-600 line-clamp-3">
              {video.description}
            </p>
          )}
          
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="text-sm text-gray-500">
              公開日: {new Date(video.publishedAt).toLocaleDateString('ja-JP')}
            </div>
            
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
            >
              <span>YouTubeで開く</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </Modal>
  );
}