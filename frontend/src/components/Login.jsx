import { useState } from "react";
import { axiosInstance } from "../auth/AxiosConfig";
import secureLocalStorage from "react-secure-storage";
import { toast } from "react-toastify";
import { Card, CardBody, Col, Form, Row, Button } from "react-bootstrap/esm";

const Login = () => {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post("/api/users/login", {
        userName,
        password,
      });
      if (response.data) {
        secureLocalStorage.setItem("accessToken", response.data.accessToken);
        secureLocalStorage.setItem("refreshToken", response.data.refreshToken);
        secureLocalStorage.setItem("user", response.data.result);
        toast.success(response.data.message, {
          position: "top-center",
        });
        window.location.href = "/";
      }
    } catch (error) {
      const errMessage = JSON.parse(error.request.response);
      toast.error(errMessage, {
        position: "top-center",
      });
    }
  };
  return (
    <div
      className="border d-flex align-items-center justify-content-center"
      style={{ height: "100vh" }}
    >
      <Card className="col-lg-3 cold-md-6 col-sm-6 bg-body-tertiary border-0">
        <Card.Body>
          <Card.Title className="text-center mb-5">
            <h4>login</h4>
          </Card.Title>
          <Form onSubmit={handleSubmit}>
            <Form.Group as={Row} className="mb-3">
              <Form.Label
                column
                lg="3"
                sm="12"
                className="d-flex align-items-center"
              >
                Username
              </Form.Label>
              <Col lg="9" sm="12">
                <Form.Control
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                />
              </Col>
            </Form.Group>

            <Form.Group as={Row} className="mb-3">
              <Form.Label
                column
                lg="3"
                sm="12"
                className="d-flex align-items-center"
              >
                Password
              </Form.Label>
              <Col lg="9" sm="12">
                <Form.Control
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Col>
            </Form.Group>

            <Form.Group as={Row} className="mb-3" controlId="formSubmitButton">
              <Col sm="12" className="text-center">
                <Button variant="primary" type="submit">
                  Login
                </Button>
              </Col>
            </Form.Group>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};
export default Login;
