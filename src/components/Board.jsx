import { BOARD_HEXES, FOCAL_POINT_KEYS } from '../hex/boardConstants';
import { hexToPixel, hexKey } from '../hex/hexUtils';
import HexTile from './HexTile';

const HEX_SIZE = 36;

const FOCAL_KEY_SET = new Set(FOCAL_POINT_KEYS);

// Pixel centers of all hexes, used to compute the bounding box
const pixels = BOARD_HEXES.map((h) => hexToPixel(h, HEX_SIZE));
const hexes_x = pixels.map((p) => p.x);
const hexes_y = pixels.map((p) => p.y);
const minX = Math.min(...hexes_x); // leftmost hex center
const maxX = Math.max(...hexes_x); // rightmost hex center
const minY = Math.min(...hexes_y); // topmost hex center
const maxY = Math.max(...hexes_y); // bottommost hex center
const BOARD_PADDING = HEX_SIZE * 1.2;  // extra space around the board so edge hexes aren't clipped
const SVG_WIDTH = maxX - minX + BOARD_PADDING * 2; // total SVG width
const SVG_HEIGHT = maxY - minY + BOARD_PADDING * 2; // total SVG height
const OFFSET_X = -minX + BOARD_PADDING; // x offset: shifts hex coords so minX lands at BOARD_PADDING
const OFFSET_Y = -minY + BOARD_PADDING; // y offset: shifts hex coords so minY lands at BOARD_PADDING

export default function Board({highlightedHexes = [], selectedHex = null, onHexClick}) {
    const highlightedSet = new Set(highlightedHexes);

    return (
        <svg
            width={SVG_WIDTH}
            height={SVG_HEIGHT}
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            style={{display: 'block', margin: '0 auto'}}
        >
            {BOARD_HEXES.map((hex) => {
                const key = hexKey(hex);
                const {x, y} = hexToPixel(hex, HEX_SIZE);
                const cx = x + OFFSET_X;
                const cy = y + OFFSET_Y;

                return (
                    <HexTile
                        key={key}
                        hex={hex}
                        center_x={cx}
                        center_y={cy}
                        size={HEX_SIZE - 1} // 1px smaller than layout size to create a visible gap between adjacent hex strokes
                        isHighlighted={highlightedSet.has(key)}
                        isFocalPoint={FOCAL_KEY_SET.has(key)}
                        isSelected={selectedHex === key}
                        onClick={onHexClick ? () => onHexClick(key, hex) : undefined}
                    />
                );
            })}
        </svg>
    );
}
