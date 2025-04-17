import React, { useState } from "react";
import {
  Container,
  Image,
  Nav,
  Navbar,
  NavDropdown,
} from "react-bootstrap/esm";
import secureLocalStorage from "react-secure-storage";
import { FaBuffer, FaChartBar } from "react-icons/fa";
import { GrTransaction } from "react-icons/gr";
import ProfileModal from "./ProfileModal";

const NavbarComponent = () => {
  const [modalShow, setModalShow] = useState(false);
  const user = secureLocalStorage.getItem("user");
  let nama = "User";
  if (user) {
    nama = user.name;
  }

  const avatar = (
    <Image
      src={"/img/avatar.jpg"}
      alt="User"
      roundedCircle
      style={{ width: "30px" }}
    />
  );
  return (
    <Navbar expand="lg" className="bg-body-tertiary print">
      <Container fluid>
        <Navbar.Brand href="/">POS APP</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <NavDropdown
              title={
                <>
                  <FaBuffer /> {"Master"}
                </>
              }
              id="basic-nav-dropdown"
            >
              <NavDropdown.Item href="/category">Kategori</NavDropdown.Item>
              <NavDropdown.Item href="/supplier">Supplier</NavDropdown.Item>
              <NavDropdown.Item href="/product">Produk</NavDropdown.Item>
            </NavDropdown>
            <NavDropdown
              title={
                <>
                  <GrTransaction /> {"Transaction"}
                </>
              }
              id="basic-nav-dropdown"
            >
              <NavDropdown.Item href="/sales">Sales</NavDropdown.Item>
              <NavDropdown.Item href="/sales-history">
                Sales History
              </NavDropdown.Item>
              <NavDropdown.Item href="/purchase">Purchase</NavDropdown.Item>
            </NavDropdown>
            <NavDropdown
              title={
                <>
                  <FaChartBar /> {"Report"}
                </>
              }
              id="basic-nav-dropdown"
            >
              <NavDropdown.Item href="/supplier-report">
                Supplier
              </NavDropdown.Item>
              <NavDropdown.Item href="/product-report">
                Product
              </NavDropdown.Item>
              <NavDropdown.Item href="/sales-report">Sales</NavDropdown.Item>
              <NavDropdown.Item href="/purchase-report">
                Purchase
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
          <NavDropdown
            title={
              <>
                {avatar} {nama}
              </>
            }
            id="collapsible-nav-dropdown"
          >
            <NavDropdown.Item href="#" onClick={() => setModalShow(true)}>
              Profil
            </NavDropdown.Item>
            <NavDropdown.Item href="/logout">Logout</NavDropdown.Item>
          </NavDropdown>
        </Navbar.Collapse>
      </Container>
      <ProfileModal
        show={modalShow}
        size="xl"
        modaTitle="Search Supplier"
        onHide={() => setModalShow(false)}
      />
    </Navbar>
  );
};

export default NavbarComponent;
