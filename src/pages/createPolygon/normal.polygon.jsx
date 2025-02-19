import { Marker, Polyline, useMapEvents } from "react-leaflet";
import PropTypes from "prop-types";
import L from "leaflet";

const m_icon = new L.Icon({
  iconUrl:
    "https://www.iconpacks.net/icons/2/free-location-icon-2955-thumb.png",
  iconSize: [40, 41],
  iconAnchor: [21, 38],
  popupAnchor: [1, -34],
});

export const NormalPolygon = ({
  setPositions,
  setActivePolygon,
  activePolygon,
  positions,
}) => {
  const isCloseTo = (point1, point2, threshold = 0.001) => {
    const latDiff = Math.abs(point1?.lat - point2?.lat);
    const lngDiff = Math.abs(point1?.lng - point2?.lng);
    return latDiff < threshold && lngDiff < threshold;
  };
  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        const clickedElement = e.originalEvent.target;
        if (
          clickedElement.closest("button") ||
          clickedElement.closest("section")
        ) {
          return;
        }

        const newPosition = e?.latlng;
        setPositions((prevPositions) => {
          const updatedPositions = [...prevPositions];
          const activePositions = updatedPositions[activePolygon];

          if (
            activePositions?.length >= 3 &&
            isCloseTo(newPosition, activePositions?.[0])
          ) {
            updatedPositions[activePolygon] = [
              ...(activePositions || []),
              activePositions?.[0],
            ];
            setActivePolygon(activePolygon + 1);
            updatedPositions.push([]);
            return updatedPositions;
          }

          updatedPositions[activePolygon] = [
            ...(activePositions || []),
            newPosition,
          ];
          return updatedPositions;
        });
      },
      drag(e) {
        const draggedElement = e?.originalEvent?.target;
        if (draggedElement && draggedElement.closest("input")) {
          this.dragging.disable();
        }
        if (draggedElement && draggedElement.closest("div")) {
          this.dragging.enable();
        }
      },
    });
    return null;
  };

  const addPointToPolygon = (newPoint) => {
    setPositions((prevPositions) => {
      const updatedPositions = [...prevPositions];
      const activePositions = [...updatedPositions[0]];
      let closestSegmentIndex = -1;
      let minDistance = Infinity;
      for (let i = 0; i < activePositions.length - 1; i++) {
        const pointA = activePositions[i];
        const pointB = activePositions[i + 1];
        const distance = distanceToSegment(newPoint, pointA, pointB);
        if (distance < minDistance) {
          minDistance = distance;
          closestSegmentIndex = i;
        }
      }
      if (closestSegmentIndex !== -1) {
        activePositions.splice(closestSegmentIndex + 1, 0, newPoint);
      }
      updatedPositions[0] = activePositions;
      updatedPositions[1] = [];
      return updatedPositions;
    });
  };

  const distanceToSegment = (point, pointA, pointB) => {
    const x = point?.lat;
    const y = point?.lng;
    const x1 = pointA?.lat;
    const y1 = pointA?.lng;
    const x2 = pointB?.lat;
    const y2 = pointB?.lng;
    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    const param = lenSq !== 0 ? dot / lenSq : -1;
    let xx, yy;
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = x - xx;
    const dy = y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };
  

  return (
    <>
      <MapClickHandler />
      <Polyline positions={positions[0]} color={"blue"} />
      {positions?.map((item, polygonIndex) => {
        return item?.map((position, index) => (
          <Marker
            key={index}
            position={position}
            draggable={true}
            icon={m_icon}
            eventHandlers={{
              dragend: (e) => {
                const newLatLng = e.target.getLatLng();
                if (polygonIndex === 0) {
                  setPositions((prevPositions) => {
                    const updatedPositions = [...prevPositions];
                    const activePositions = [...updatedPositions[0]];
                    activePositions[index] = newLatLng;
                    if (index === 0 && activePositions.length > 1) {
                      activePositions[activePositions.length - 1] = newLatLng;
                    } else if (
                      index === activePositions.length - 1 &&
                      activePositions.length > 1
                    ) {
                      activePositions[0] = newLatLng;
                    }
                    updatedPositions[0] = activePositions;
                    return updatedPositions;
                  });
                } else {
                  addPointToPolygon(newLatLng);
                }
              },
              dblclick: () => {
                setPositions((prevPositions) => {
                  const updatedPositions = [...prevPositions];
                  const activePositions = [...updatedPositions[polygonIndex]];
                  activePositions.splice(index, 1);
                  if (polygonIndex === 0 && activePositions.length === 0) {
                    updatedPositions[polygonIndex] = [];
                    setActivePolygon(0);
                  } else {
                    updatedPositions[polygonIndex] = activePositions;
                  }

                  return updatedPositions;
                });
              },

              click: () => {
                if (index === 0 && item.length > 2) {
                  setPositions((prevPositions) => {
                    const updatedPositions = [...prevPositions];
                    updatedPositions[polygonIndex] = [
                      ...updatedPositions[polygonIndex],
                      updatedPositions[polygonIndex][0], // İlk noktayı tekrar ekle
                    ];
                    setActivePolygon(polygonIndex + 1); // ActivePolygon'u bir artır
                    updatedPositions.push([]); // Yeni bir poligon ekle
                    return updatedPositions;
                  });
                }
              },
            }}
          />
        ));
      })}
    </>
  );
};

NormalPolygon.propTypes = {
  setPositions: PropTypes.func,
  setActivePolygon: PropTypes.func,
  activePolygon: PropTypes.number,
  positions: PropTypes.array,
};
