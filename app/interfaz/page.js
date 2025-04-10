"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button, Modal, Form } from "react-bootstrap";
import Cookies from "js-cookie";
import axios from "axios";
import styles from "./interfaz.module.css";
import "bootstrap/dist/css/bootstrap.min.css";

const API_BASE_URL_GET = "https://gatito027.vercel.app";
const API_BASE_URL_POST = "https://prueba-moleculer.vercel.app";

export default function PlaneacionProduccion() {
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [filterOptions, setFilterOptions] = useState([]);
  const [planningData, setPlanningData] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("Todos");
  const [selectedSucursal, setSelectedSucursal] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planDate, setPlanDate] = useState("");
  const [dailyProduction, setDailyProduction] = useState("");
  const [productionUnit, setProductionUnit] = useState("Kg");
  const [selectedPlanSucursal, setSelectedPlanSucursal] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [editSucursal, setEditSucursal] = useState("");
  const [editFecha, setEditFecha] = useState("");
  const [editProduccion, setEditProduccion] = useState("");
  const [editEstado, setEditEstado] = useState("");
  const itemsPerPage = 5;
  const router = useRouter();

  const statusOptions = ["Todos", "Planeado", "En Proceso", "Completado"];

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return isNaN(date.getTime())
      ? "N/A"
      : date.toLocaleDateString("es-ES", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
  };

  const formatDateForInput = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "N/A";
    return date.toISOString().split("T")[0];
  };

  const handleApiError = (error, action, details = "") => {
    console.error(`Error al ${action}:`, error.message, details);
    setModalMessage(
      `❌ Error al ${action}. Detalles: ${error.message}${
        details ? ` - ${details}` : ""
      }`
    );
    setShowModal(true);
  };

  const fetchData = async (endpoint, setter, errorAction) => {
    try {
      const token = Cookies.get("token");
      if (!token) {
        throw new Error("No token found");
      }

      const response = await axios.get(`${API_BASE_URL_GET}/${endpoint}`, {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Keep the Authorization header for session
          Cookie: `token=${token}`, // Add the Cookie header as per the image
        },
      });

      const data = response.data;
      const sortedData = Array.isArray(data)
        ? data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        : [];
      setter(sortedData);
    } catch (error) {
      handleApiError(
        error,
        errorAction,
        `No se pudo conectar con ${API_BASE_URL_GET}/${endpoint}`
      );
    }
  };

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) {
      router.push("/login");
      return;
    }
  
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchData("obtener-sucursales", setFilterOptions, "obtener las sucursales"),
        fetchData("obtener-planeacion", setPlanningData, "obtener la planeación"),
      ]);
      setIsLoading(false);
    };
  
    loadData();
  }, [router]);

  const filterData = (data, status, sucursal, date) => {
    return data
      .filter((row) => status === "Todos" || row.estado === status)
      .filter((row) => sucursal === "" || row.nombre === sucursal)
      .filter((row) => {
        if (!date) return true;
        const rowDate = new Date(row.fecha);
        if (isNaN(rowDate.getTime())) return false;
        const selected = new Date(date);
        return (
          rowDate.getFullYear() === selected.getFullYear() &&
          rowDate.getMonth() === selected.getMonth()
        );
      });
  };

  const filteredData = useMemo(
    () =>
      filterData(planningData, selectedStatus, selectedSucursal, selectedDate),
    [planningData, selectedStatus, selectedSucursal, selectedDate]
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatus, selectedSucursal, selectedDate, planningData]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage]);

  const handleLogout = () => {
    setModalMessage("✅ ¿Estás seguro de que quieres cerrar sesión?");
    setShowModal(true);
  };

  const confirmLogout = () => {
    Cookies.remove("token");
    setShowModal(false);
    router.push("/login");
  };

  const handlePlanClick = () => {
    setShowPlanModal(true);
  };

  const handleClosePlanModal = () => {
    setShowPlanModal(false);
    setPlanDate("");
    setDailyProduction("");
    setProductionUnit("Kg");
    setSelectedPlanSucursal("");
  };

  const handleSavePlan = async () => {
    if (!selectedPlanSucursal || !planDate || !dailyProduction) {
      setModalMessage("⚠️ Por favor, completa todos los campos antes de guardar.");
      setShowModal(true);
      return;
    }

    const productionValue = parseFloat(dailyProduction);
    if (productionValue <= 0) {
      setModalMessage("⚠️ La producción diaria debe ser mayor que 0.");
      setShowModal(true);
      return;
    }

    const sucursalId = filterOptions.find(
      (option) => option.nombre === selectedPlanSucursal
    )?.id;
    if (!sucursalId) {
      setModalMessage("⚠️ Sucursal no válida.");
      setShowModal(true);
      return;
    }

    let produccionEstimadaKg = productionValue;
    if (productionUnit === "Toneladas") {
      produccionEstimadaKg *= 1000;
    }

    const planData = {
      sucursal_id: sucursalId,
      fecha: planDate,
      produccion_estimada_kg: produccionEstimadaKg,
      estado: "Planeado",
    };

    try {
      const token = Cookies.get("token");
      if (!token) {
        setModalMessage(
          "⚠️ No se encontró un token de autenticación. Por favor, inicia sesión nuevamente."
        );
        setShowModal(true);
        router.push("/login");
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL_POST}/api/add`,
        planData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // Keep the Authorization header for session
            Cookie: `token=${token}`, // Add the Cookie header as per the image
          },
        }
      );

      setModalMessage("✅ Planeación guardada y publicada exitosamente!");
      setShowModal(true);
      handleClosePlanModal();

      setIsLoading(true);
      await fetchData("obtener-planeacion", setPlanningData, "obtener la planeación");
      setIsLoading(false);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        setModalMessage(
          "⚠️ Tu sesión ha expirado. Por favor, inicia sesión nuevamente."
        );
        setShowModal(true);
        Cookies.remove("token");
        router.push("/login");
      } else {
        handleApiError(error, "guardar y publicar la planeación", error.message);
      }
    }
  };

  const handleViewClick = (row) => {
    setSelectedRow(row);
    setEditSucursal(row.nombre || "");
    setEditFecha(formatDateForInput(row.fecha));
    setEditProduccion(row.produccion_estimada_kg || "");
    setEditEstado(row.estado || "");
    setShowViewModal(true);
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setSelectedRow(null);
    setEditSucursal("");
    setEditFecha("");
    setEditProduccion("");
    setEditEstado("");
  };

  const handleUpdatePlan = async () => {
    if (!editSucursal || !editFecha || !editProduccion || !editEstado) {
      setModalMessage("⚠️ Por favor, completa todos los campos antes de actualizar.");
      setShowModal(true);
      return;
    }

    const productionValue = parseFloat(editProduccion);
    if (productionValue <= 0) {
      setModalMessage("⚠️ La producción estimada debe ser mayor que 0.");
      setShowModal(true);
      return;
    }

    const sucursalId = filterOptions.find(
      (option) => option.nombre === editSucursal
    )?.id;
    if (!sucursalId) {
      setModalMessage("⚠️ Sucursal no válida.");
      setShowModal(true);
      return;
    }

    const updatedPlanData = {
      id: selectedRow.id,
      sucursal_id: sucursalId,
      fecha: editFecha,
      produccion_estimada_kg: productionValue,
      estado: editEstado,
    };

    try {
      const token = Cookies.get("token");
      if (!token) {
        setModalMessage(
          "⚠️ No se encontró un token de autenticación. Por favor, inicia sesión nuevamente."
        );
        setShowModal(true);
        router.push("/login");
        return;
      }

      const response = await axios.put(
        `${API_BASE_URL_POST}/api/modify/${selectedRow.id}`,
        updatedPlanData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // Keep the Authorization header for session
            Cookie: `token=${token}`, 
          },
        }
      );

      setPlanningData((prevData) =>
        prevData.map((item) =>
          item.id === selectedRow.id
            ? {
                ...item,
                nombre: editSucursal,
                fecha: editFecha,
                produccion_estimada_kg: productionValue,
                estado: editEstado,
                sucursal_id: sucursalId,
              }
            : item
        )
      );

      setModalMessage("✅ Planeación actualizada exitosamente!");
      setShowModal(true);
      handleCloseViewModal();
    } catch (error) {
      if (error.response && error.response.status === 401) {
        setModalMessage(
          "⚠️ Tu sesión ha expirado. Por favor, inicia sesión nuevamente."
        );
        setShowModal(true);
        Cookies.remove("token");
        router.push("/login");
      } else {
        handleApiError(error, "actualizar la planeación", error.message);
      }
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <div className={styles.container}>
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>¡Atención!</Modal.Title>
        </Modal.Header>
        <Modal.Body>{modalMessage}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cerrar
          </Button>
          {modalMessage.includes("cerrar sesión") && (
            <Button variant="danger" onClick={confirmLogout}>
              Cerrar Sesión
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      <Modal show={showPlanModal} onHide={handleClosePlanModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Asignar Planeación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3" controlId="formSucursal">
              <Form.Label style={{ fontWeight: "bold" }}>Sucursal</Form.Label>
              <Form.Select
                value={selectedPlanSucursal}
                onChange={(e) => setSelectedPlanSucursal(e.target.value)}
              >
                <option value="">Selecciona una sucursal</option>
                {filterOptions.map((option) => (
                  <option key={option.id} value={option.nombre}>
                    {option.nombre}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3" controlId="formFecha">
              <Form.Label style={{ fontWeight: "bold" }}>Mes</Form.Label>
              <Form.Control
                type="date"
                value={planDate}
                onChange={(e) => setPlanDate(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formProduccion">
              <Form.Label style={{ fontWeight: "bold" }}>
                Producción diaria
              </Form.Label>
              <div className="d-flex align-items-center">
                <Form.Control
                  type="number"
                  value={dailyProduction}
                  onChange={(e) => setDailyProduction(e.target.value)}
                  placeholder="Ingresa cantidad"
                  min="0"
                  className="me-2"
                />
                <Form.Select
                  value={productionUnit}
                  onChange={(e) => setProductionUnit(e.target.value)}
                >
                  <option value="Kg">Kg</option>
                  <option value="Toneladas">Toneladas</option>
                </Form.Select>
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleSavePlan}>
            Guardar
          </Button>
          <Button variant="secondary" onClick={handleClosePlanModal}>
            Cancelar
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showViewModal} onHide={handleCloseViewModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Editar Planeación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRow ? (
            <Form>
              <Form.Group className="mb-3" controlId="formEditSucursal">
                <Form.Label style={{ fontWeight: "bold" }}>Sucursal</Form.Label>
                <Form.Select
                  value={editSucursal}
                  onChange={(e) => setEditSucursal(e.target.value)}
                >
                  <option value="">Selecciona una sucursal</option>
                  {filterOptions.map((option) => (
                    <option key={option.id} value={option.nombre}>
                      {option.nombre}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3" controlId="formEditFecha">
                <Form.Label style={{ fontWeight: "bold" }}>Fecha</Form.Label>
                <Form.Control
                  type="date"
                  value={editFecha}
                  onChange={(e) => setEditFecha(e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="formEditProduccion">
                <Form.Label style={{ fontWeight: "bold" }}>
                  Producción Estimada (Kg)
                </Form.Label>
                <Form.Control
                  type="number"
                  value={editProduccion}
                  onChange={(e) => setEditProduccion(e.target.value)}
                  placeholder="Ingresa cantidad"
                  min="0"
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="formEditEstado">
                <Form.Label style={{ fontWeight: "bold" }}>Estado</Form.Label>
                <Form.Select
                  value={editEstado}
                  onChange={(e) => setEditEstado(e.target.value)}
                >
                  {statusOptions
                    .filter((status) => status !== "Todos")
                    .map((status, index) => (
                      <option key={index} value={status}>
                        {status}
                      </option>
                    ))}
                </Form.Select>
              </Form.Group>
            </Form>
          ) : (
            <p>No hay datos disponibles.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleUpdatePlan}>
            Actualizar
          </Button>
          <Button variant="secondary" onClick={handleCloseViewModal}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Planeación de Producción</h1>
        </div>

        <div className={styles.filtersContainer}>
          <div className={styles.filterGroup}>
            <span>Filtro por Sucursal:</span>
            <select
              className={styles.select}
              value={selectedSucursal}
              onChange={(e) => setSelectedSucursal(e.target.value)}
            >
              <option value="">Todos</option>
              {filterOptions.map((option) => (
                <option key={option.id} value={option.nombre}>
                  {option.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <span>Filtro por Estado:</span>
            <select
              className={styles.select}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              {statusOptions.map((status, index) => (
                <option key={index} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.dateFilter}>
            <span>Mes y Año:</span>
            <input
              type="date"
              value={selectedDate || ""}
              onChange={(e) => setSelectedDate(e.target.value || null)}
            />
          </div>

          <Button variant="danger" onClick={handleLogout}>
            Cerrar Sesión
          </Button>
        </div>

        <div className={styles.planButtonContainer}>
          <Button variant="success" onClick={handlePlanClick}>
            + Planificar
          </Button>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.productionTable}>
            <thead>
              <tr>
                <th>Sucursal</th>
                <th>Fecha</th>
                <th>Producción Estimada (Kg)</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="5">Cargando datos...</td>
                </tr>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((row) => (
                  <tr key={row.id}>
                    <td>{row.nombre || "N/A"}</td>
                    <td>{formatDateForInput(row.fecha)}</td>
                    <td>{row.produccion_estimada_kg || "N/A"}</td>
                    <td>{row.estado || "N/A"}</td>
                    <td>
                      <Button variant="info" onClick={() => handleViewClick(row)}>
                        Ver
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">No hay datos disponibles</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <Button
              variant="primary"
              onClick={handlePreviousPage}
              disabled={currentPage === 1 || isLoading}
            >
              Anterior
            </Button>
            <span>
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="primary"
              onClick={handleNextPage}
              disabled={currentPage === totalPages || isLoading}
            >
              Siguiente
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}