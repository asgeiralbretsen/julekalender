interface StockingProps {
  topColor: string;
  topStripesColor: string;
  mainColor: string;
  heelColor: string;
  stripesColor: string;

  onClickTopColor?: () => void;
  onClickTopStripesColor?: () => void;
  onClickMainColor?: () => void;
  onClickHeelColor?: () => void;
  onClickStripesColor?: () => void;
}

const SVGComponent = ({
  topColor,
  topStripesColor,
  mainColor,
  heelColor,
  stripesColor,
  onClickTopColor,
  onClickTopStripesColor,
  onClickMainColor,
  onClickHeelColor,
  onClickStripesColor,
}: StockingProps) => (
  <svg
    width="400px"
    height="350px"
    viewBox="0 0 64 64"
    xmlns="http://www.w3.org/2000/svg"
    fill="#000000"
  >
    <g id="SVGRepo_bgCarrier" strokeWidth={0} />
    <g
      id="SVGRepo_tracerCarrier"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <g id="SVGRepo_iconCarrier">
      <g id="flat">
        <rect
          height={12}
          rx={2}
          ry={2}
          onClick={onClickTopColor}
          style={{ fill: topColor || "#e3e3e1" }}
          width={28}
          x={19}
          y={3}
        />
        <path
          onClick={onClickTopColor}
          d="M45,3h-.24c-3.88,7.475-12.142,10.651-18.47,12H45a2,2,0,0,0,2-2V5A2,2,0,0,0,45,3Z"
          style={{ fill: topColor || "#dbdbd9" }}
        />
        <path
          onClick={onClickMainColor}
          d="M44,15H22V33L9,39.844a11.225,11.225,0,0,0-6,9.932H3A11.224,11.224,0,0,0,14.224,61h.215a11.228,11.228,0,0,0,4.869-1.111l19.03-9.163A10,10,0,0,0,44,41.716Z"
          style={{ fill: mainColor || "#dd4a43" }}
        />
        <path
          onClick={onClickStripesColor}
          d="M15.65,60.581,5.98,42.348A1,1,0,0,1,6.4,41h0a1,1,0,0,1,1.35.419L17.419,59.65A1,1,0,0,1,17,61h0A1,1,0,0,1,15.65,60.581Z"
          style={{ fill: stripesColor || "#7ea82d" }}
        />
        <path
          onClick={onClickHeelColor}
          d="M43.465,37.076A11.623,11.623,0,0,0,34,52l.31.665,4.028-1.939A10,10,0,0,0,44,41.716v-4.7Z"
          style={{ fill: heelColor || "#7ea82d" }}
        />
        {/* Top stripes */}
        <rect
          height={9}
          width={2}
          x={38}
          y={6}
          onClick={onClickTopStripesColor}
          style={{ fill: topStripesColor }}
        />
        <rect
          height={9}
          width={2}
          x={34}
          y={6}
          onClick={onClickTopStripesColor}
          style={{ fill: topStripesColor }}
        />
        <rect
          height={9}
          width={2}
          x={30}
          y={6}
          onClick={onClickTopStripesColor}
          style={{ fill: topStripesColor }}
        />
        <rect
          height={9}
          width={2}
          x={26}
          y={6}
          onClick={onClickTopStripesColor}
          style={{ fill: topStripesColor }}
        />
        <rect
          height={9}
          width={2}
          x={42}
          y={6}
          onClick={onClickTopStripesColor}
          style={{ fill: topStripesColor }}
        />
        <rect
          height={5}
          width={2}
          x={22}
          y={10}
          onClick={onClickTopStripesColor}
          style={{ fill: topStripesColor }}
        />
        <rect
          height={2}
          width={2}
          x={22}
          y={6}
          onClick={onClickTopStripesColor}
          style={{ fill: topStripesColor }}
        />
        {/* Additional paths for stripes can stay the same */}
      </g>
    </g>
  </svg>
);

export default SVGComponent;
