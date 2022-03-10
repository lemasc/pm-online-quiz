import React, { useState, ComponentProps, Fragment } from "react";
import { PieChart as Chart } from "react-minimal-pie-chart";

type Props = {
  data: ComponentProps<typeof Chart>["data"];
};

function PieChart(props: Props) {
  const [hovered, setHovered] = useState<number | undefined>(undefined);

  const data = props.data.map((entry, i) => {
    if (hovered === i) {
      return {
        ...entry,
        color: "#a3a3a3",
      };
    }
    return entry;
  });

  return (
    <Chart
      style={{
        fontSize: "6px",
      }}
      data={data}
      radius={Chart.defaultProps.radius - 6}
      segmentsStyle={{ transition: "stroke .3s", cursor: "pointer" }}
      segmentsShift={1}
      // label={({ dataEntry }) => Math.round(dataEntry.percentage) + "%"}
      animate
      label={({ x, y, dx, dy, dataEntry }) =>
        dataEntry.percentage >= 20 ? (
          <Fragment key={dataEntry.title}>
            <text
              x={x}
              y={y}
              dx={dx + (dataEntry.percentage > 20 ? 2 : 4)}
              dy={dy + (dataEntry.percentage > 20 ? -1 : -5)}
              dominantBaseline="central"
              textAnchor="middle"
              style={{
                fill: "#fff",
                pointerEvents: "none",
                fontWeight: "bold",
                fontSize: "8px",
              }}
            >
              {Math.round(dataEntry.percentage) + "%"}
            </text>
            <text
              x={x}
              y={y}
              dx={dx + (dataEntry.percentage > 20 ? 2 : 4)}
              dy={dy + (dataEntry.percentage > 20 ? 8 : 4)}
              dominantBaseline="central"
              textAnchor="middle"
              style={{
                fill: "#fff",
                pointerEvents: "none",
                fontSize: "4px",
              }}
            >
              {dataEntry.title}
            </text>
          </Fragment>
        ) : null
      } /*
      labelStyle={{
        fill: "#fff",
        opacity: 0.75,
        pointerEvents: "none",
      }}*/
      onMouseOver={(_, index) => {
        setHovered(index);
      }}
      onMouseOut={() => {
        setHovered(undefined);
      }}
    />
  );
}

export default PieChart;
