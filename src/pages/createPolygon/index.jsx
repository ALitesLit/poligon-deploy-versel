import { useState, useEffect, useRef } from "react";
import "../home/app.css";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Button, Input, Modal, Space } from "antd";
import { useParams, useNavigate } from "react-router-dom";
import { NormalPolygon } from "./normal.polygon";
import RangeInput from "../../util/range.input";
import { CirclePolygon } from "./circle.polygon";
import { handleGetCenter } from "../../util/service";

import { editPoligon, getPoligons } from "../../service/service";

export const CreatePolygon = () => {
  const [loading, setLoading] = useState(true);
  const [positions, setPositions] = useState([[]]);
  const [activePolygon, setActivePolygon] = useState(0);
  const [center, setCenter] = useState(null);
  const [radius, setRadius] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [polygonName, setPolygonName] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(14);
  const mapRef = useRef(null);

  const navigate = useNavigate();
  const { id, type } = useParams();

  const showModal = (e) => {
    e.stopPropagation();
    setIsModalOpen(true);
  };

  const calculatePolygonCentroid = (polygon) => {
    if (!polygon || polygon.length === 0) {
      throw new Error("Polygon points are required.");
    }
    let xSum = 0;
    let ySum = 0;
    polygon.forEach((point) => {
      xSum += point?.lat;
      ySum += point?.lng;
    });
    const centroid = {
      lat: xSum / polygon.length,
      lng: ySum / polygon.length,
    };
    return centroid;
  };

  const handleOk = async (e) => {
    e.stopPropagation();
    if (!polygonName) return alert("Please enter a name for the polygon!");
    const oldPositions = JSON.parse(localStorage.getItem("polygons")) || [];
    let newPositions = [...oldPositions];
    if (id != "new") {
      newPositions[id] = {
        ...newPositions[id],
        name: polygonName,
        positions: positions[0],
        center:
          type === "circle" ? center : calculatePolygonCentroid(positions[0]),
        radius,
      };
    } else {
      const color = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
      newPositions.push({
        name: polygonName,
        positions: positions[0],
        center:
          type === "circle" ? center : calculatePolygonCentroid(positions[0]),
        type: type === "circle" ? "circle" : "polygon",
        radius,
        color,
      });
    }

    try {
      const cords = []; // Этот список будет содержать нужный беку формат. Он и будет оправлен на бек

      // Здесь список переводится в нужный для бека формат
      for (var i = 0; i < positions[0].length; i++) {
        cords.push([positions[0][i].lat, positions[0][i].lng]);
      }

      // Отправка данных на бек
      const { data } = await editPoligon(id, polygonName, cords);
      
      // Если с бека пришла ошибка то здесь она будет обрабатываться
      if (data.status !== "success") {
        throw `Error`;
      }

      localStorage.setItem("polygons", JSON.stringify(newPositions));
      alert("Polygons saved successfully!");
      setIsModalOpen(false);
      handleGetCenter(mapRef);

      // Если всё успешно пользователь отправится на главную
      navigate("/");
    } catch (err) {
      alert(err);
    }
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    setIsModalOpen(false);
  };

  const getPolygon = (id) => {
    if (id != "new") {
      const polygons = JSON.parse(localStorage.getItem("polygons")) || [];
      const polygon = polygons[id];
      if (polygon) {
        setPolygonName(polygon.name);
        if (type === "circle") {
          setCenter(polygon.center);
          setRadius(polygon.radius);
        } else {
          setPositions([polygon.positions]);
          setActivePolygon(1);
        }
      }
    } else {
      setPositions([[]]);
      setPolygonName("");
    }
  };

  useEffect(() => {
    setLoading(true);
    setUserLocation(JSON.parse(localStorage.getItem("userLocation")));
    setTimeout(() => {
      setLoading(false);
    }, 10);
    getPolygon(id);
  }, [id]);

  if (loading) {
    return <div>Loading map...</div>;
  }

  const savePolygons = (e) => {
    setPolygonName(e.target.value);
  };

  const deletePolygon = () => {
    if (id != "new") {
      const polygons = JSON.parse(localStorage.getItem("polygons")) || [];
      polygons.splice(id, 1);
      localStorage.setItem("polygons", JSON.stringify(polygons));
      alert("Polygon deleted successfully!");
      setIsModalOpen(false);
      navigate("/");
    }
    handleGetCenter(mapRef);
  };

  return (
    <>
      <MapContainer
        center={userLocation || [51.505, -0.09]}
        zoom={type === "polygon" ? 14 : zoomLevel}
        minZoom={3}
        style={{ height: "100vh", width: "100%" }}
        doubleClickZoom={false}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {type === "polygon" ? (
          <NormalPolygon
            positions={positions}
            activePolygon={activePolygon}
            setActivePolygon={setActivePolygon}
            setPositions={setPositions}
          />
        ) : (
          <CirclePolygon
            center={center}
            setCenter={setCenter}
            radius={radius}
            setRadius={setRadius}
            setZoomLevel={setZoomLevel}
          />
        )}

        <Space className="button-group" direction="horizontal">
          {type === "circle" && (
            <RangeInput
              value={radius}
              setValue={setRadius}
              zoomLevel={zoomLevel}
              center={center}
            />
          )}
          {id != "new" && (
            <>
              <Button
                type="primary"
                onClick={deletePolygon}
                className="my_polygons"
                danger
              >
                delete
              </Button>
            </>
          )}
          
          {/* Если точек меньше 3 или они не сомкнутнуты то кнопка просто не появится */}
          {((positions?.[0]?.length > 3) && ((positions?.[0][0] == positions?.[0][positions[0].length - 1]) || id != "new")) && (
            <Button type="default" onClick={showModal} className="save-polygon">
              Save Polygon
            </Button>
          )}
          <Button
            type="default"
            onClick={() => {
              navigate("/");
              handleGetCenter(mapRef);
            }}
            className="save-polygon"
          >
            ×
          </Button>
        </Space>
        <Modal
          title="Filter polygon name"
          open={isModalOpen}
          onOk={handleOk}
          onCancel={handleCancel}
          centered
          style={{ zIndex: 9999 }}
        >
          <Input
            placeholder="input with clear icon"
            allowClear
            onChange={savePolygons}
            style={{ fontSize: "16px" }}
            value={polygonName}
          />
        </Modal>
      </MapContainer>
    </>
  );
};
