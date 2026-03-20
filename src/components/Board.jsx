import {BOARD_HEXES, FOCAL_POINT_KEYS} from '../hex/boardConstants';
import {hexToPixel, hexKey} from '../hex/hexUtils';
import HexTile from './HexTile';

const HEX_SIZE = 36;

const FOCAL_KEY_SET = new Set(FOCAL_POINT_KEYS);

// Compute bounding box to center the SVG
const pixels = BOARD_HEXES.map((h) => hexToPixel(h, HEX_SIZE));
const xs = pixels.map((p) => p.x);
const ys = pixels.map((p) => p.y);
const minX = Math.min(...xs);
const maxX = Math.max(...xs);
const minY = Math.min(...ys);
const maxY = Math.max(...ys);
const PAD = HEX_SIZE * 1.2;
const SVG_W = maxX - minX + PAD * 2;
const SVG_H = maxY - minY + PAD * 2;
const OX = -minX + PAD;
const OY = -minY + PAD;

export default function Board({highlightedHexes = [], selectedHex = null, onHexClick}) {
    const highlightedSet = new Set(highlightedHexes);

    return (
        <svg
            width={SVG_W}
            height={SVG_H}
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            style={{display: 'block', margin: '0 auto'}}
        >
            {BOARD_HEXES.map((hex) => {
                const key = hexKey(hex);
                const {x, y} = hexToPixel(hex, HEX_SIZE);
                const cx = x + OX;
                const cy = y + OY;

                return (
                    <HexTile
                        key={key}
                        hex={hex}
                        cx={cx}
                        cy={cy}
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
