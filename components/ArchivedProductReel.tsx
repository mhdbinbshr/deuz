import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Film, Sparkles, Eye, ArrowUpRight } from 'lucide-react';

interface MuseumArtifact {
  _id?: string;
  id?: string;
  image: string;
  gallery?: string[];
  title: string;
  houseCode?: string;
  edition?: string;
  details?: Record<string, string>;
  isArchived?: boolean;
}

interface ArchivedProductReelProps {
  items: MuseumArtifact[];
  onSelectArtifact: (item: MuseumArtifact, index: number) => void;
}

export const ArchivedProductReel: React.FC<ArchivedProductReelProps> = ({ items, onSelectArtifact }) => {
  // Aggregate complete images from all archived products
  const reelFrames = useMemo(() => {
    const frames: Array<{
      imgUrl: string;
      artifact: MuseumArtifact;
      artifactIndex: number;
      photoIndex: number;
      totalPhotos: number;
    }> = [];

    items.forEach((item, artifactIndex) => {
      const productImages = [
        item.image,
        ...(Array.isArray(item.gallery) ? item.gallery : [])
      ].filter((img, idx, arr) => Boolean(img) && typeof img === 'string' && arr.indexOf(img) === idx);

      productImages.forEach((imgUrl, photoIndex) => {
        frames.push({
          imgUrl,
          artifact: item,
          artifactIndex,
          photoIndex: photoIndex + 1,
          totalPhotos: productImages.length
        });
      });
    });

    return frames;
  }, [items]);

  if (reelFrames.length === 0) return null;

  // Duplicate list to achieve infinite seamless loop
  const duplicatedFrames = [...reelFrames, ...reelFrames];

  return (
    <div className="relative w-full overflow-hidden my-12 py-6 border-y border-[#c5a059]/30 bg-[#060606] shadow-[0_10px_40px_rgba(0,0,0,0.85)]">
      {/* Film Reel Perforations Header */}
      <div className="max-w-7xl mx-auto px-6 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full border border-[#c5a059]/40 flex items-center justify-center text-[#c5a059]">
            <Film size={12} />
          </div>
          <div>
            <span className="text-[9px] uppercase font-mono tracking-[0.3em] text-[#c5a059] block">
              Complete Visual Chronicle
            </span>
            <h4 className="text-sm font-serif uppercase tracking-[0.15em] text-[#f4ecd8]">
              Continuous Archival Reel
            </h4>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-[9px] font-mono tracking-widest text-[#c5a059]/70 uppercase">
          <Sparkles size={11} className="text-[#c5a059] animate-pulse" />
          <span>Auto-Animated Curatorial Tape ({reelFrames.length} Frames)</span>
        </div>
      </div>

      {/* Filmstrip Sprocket Holes Top */}
      <div className="w-full flex justify-between gap-2 overflow-hidden px-2 mb-3 opacity-25 pointer-events-none select-none">
        {Array.from({ length: 48 }).map((_, i) => (
          <div key={`hole_top_${i}`} className="w-3 h-2 bg-[#c5a059] rounded-xs shrink-0" />
        ))}
      </div>

      {/* Auto-Animated Infinite Scrolling Carousel */}
      <div className="relative w-full overflow-hidden group">
        {/* Soft edge fade masks */}
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-[#060606] via-[#060606]/80 to-transparent z-20 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-[#060606] via-[#060606]/80 to-transparent z-20 pointer-events-none" />

        <motion.div
          className="flex gap-4 sm:gap-6 w-max py-2 cursor-grab active:cursor-grabbing"
          animate={{ x: ['0%', '-50%'] }}
          transition={{
            repeat: Infinity,
            ease: 'linear',
            duration: Math.max(25, reelFrames.length * 4.5)
          }}
          whileHover={{ animationPlayState: 'paused' }}
        >
          {duplicatedFrames.map((frame, idx) => (
            <motion.div
              key={`frame_${idx}`}
              onClick={() => onSelectArtifact(frame.artifact, frame.artifactIndex)}
              whileHover={{ scale: 1.04, y: -4 }}
              transition={{ duration: 0.3 }}
              className="relative w-44 sm:w-56 aspect-[3/4] bg-[#0c0c0c] border border-[#c5a059]/30 rounded-sm overflow-hidden shrink-0 cursor-pointer shadow-[0_8px_25px_rgba(0,0,0,0.7)] group/card"
            >
              {/* Exhibit Image */}
              <img
                src={frame.imgUrl}
                alt={frame.artifact.title}
                className="w-full h-full object-cover grayscale group-hover/card:grayscale-0 transition-all duration-700 group-hover/card:scale-105"
                loading="lazy"
              />

              {/* Gradient Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-80 group-hover/card:opacity-60 transition-opacity" />

              {/* Corner Accent */}
              <div className="absolute top-2 left-2 text-[8px] font-mono text-[#c5a059]/60">
                FRAME {String((idx % reelFrames.length) + 1).padStart(2, '0')}
              </div>

              {/* Frame counter badge */}
              <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/70 border border-[#c5a059]/30 text-[8px] font-mono text-[#c5a059]">
                {frame.photoIndex}/{frame.totalPhotos}
              </div>

              {/* Bottom Details Overlay */}
              <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black via-black/90 to-transparent">
                <div className="text-[8px] font-mono uppercase tracking-widest text-[#c5a059]/90 mb-0.5 truncate">
                  {frame.artifact.houseCode || 'ARCHIVE EXHIBIT'}
                </div>
                <h5 className="text-xs font-serif text-white tracking-wider truncate group-hover/card:text-[#c5a059] transition-colors">
                  {frame.artifact.title}
                </h5>
                <div className="mt-1 flex items-center justify-between text-[8px] font-mono text-white/50 tracking-wider">
                  <span className="flex items-center gap-1">
                    <Eye size={10} className="text-[#c5a059]" /> Inspect
                  </span>
                  <ArrowUpRight size={10} className="text-[#c5a059]" />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Filmstrip Sprocket Holes Bottom */}
      <div className="w-full flex justify-between gap-2 overflow-hidden px-2 mt-3 opacity-25 pointer-events-none select-none">
        {Array.from({ length: 48 }).map((_, i) => (
          <div key={`hole_bottom_${i}`} className="w-3 h-2 bg-[#c5a059] rounded-xs shrink-0" />
        ))}
      </div>
    </div>
  );
};

export default ArchivedProductReel;
