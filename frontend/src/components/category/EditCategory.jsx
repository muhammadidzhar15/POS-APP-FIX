import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { axiosInstance } from "../../auth/AxiosConfig";
import { toast } from "react-toastify";
import NavbarComponent from "../NavbarComponent";
import { Breadcrumb, Button, Col, Container, Form, Row } from "react-bootstrap";
import { FaSave } from "react-icons/fa";

const EditCategory = () => {
  const [name, setName] = useState("");
  const navigate = useNavigate();
  const { id } = useParams();

  const loadData = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`/api/categorys/${id}`);
      if (response.data) {
        setName(response.data.result.kategoryName);
      }
    } catch (error) {
      const errMessage = JSON.parse(error.request.response);
      toast.error(errMessage.message, {
        position: "top-center",
      });
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axiosInstance.put(`/api/categorys/${id}`, {
        kategoryName: name,
      });

      if (response.data) {
        toast.success(response.data.message, {
          position: "top-center",
        });
        navigate("/category");
      }
    } catch (error) {
      const errMessage = JSON.parse(error.request.response);
      toast.error(errMessage.message, {
        position: "top-center",
      });
    }
  };

  return (
    <>
      <NavbarComponent />
      <Container>
        <Row className="mt-3 bg-body-tertiary rounded p-3 pb-0">
          <Col>
            <Breadcrumb>
              <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
              <Breadcrumb.Item href="#">Master</Breadcrumb.Item>
              <Breadcrumb.Item href="/category">Category</Breadcrumb.Item>
              <Breadcrumb.Item active>Edit Category</Breadcrumb.Item>
            </Breadcrumb>
          </Col>
        </Row>
        <Row className="mt-3 bg-body-tertiary rounded p-3">
          <Col>
            <form onSubmit={handleSubmit}>
              <Form.Group as={Row} className="mb-3">
                <Form.Label column sm="2">
                  Category Name
                </Form.Label>
                <Col sm="10">
                  <Form.Control
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Col>
              </Form.Group>
              <Row>
                <Col md={{ span: 10, offset: 2 }}>
                  <Button type="submit" variant="primary">
                    <FaSave /> Submit
                  </Button>
                </Col>
              </Row>
            </form>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default EditCategory;
