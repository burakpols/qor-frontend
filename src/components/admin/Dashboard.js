import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Container,
  ButtonGroup,
} from "react-bootstrap";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
const ProductTable = () => {
  const [items, setItems] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editedProduct, setEditedProduct] = useState({});
  const [newProduct, setNewProduct] = useState({
    id: "",
    category: "",
    subcategory: "",
    title: "",
    desc: "",
    price: "",
    img: "",
  });
  const [deleteItemId, setDeleteItemId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // const main_url = "http://localhost:3800";
  const main_url= "https://mihman-be.vercel.app"
  const fetchItems = async () => {
    try {
      const response = await axios.get(`${main_url}/items`);
      setItems(response.data);
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };
  useEffect(() => {
    fetchItems();
  }, []);

  const updateItemById = async (id, newData) => {
    try {
      let response = await axios.post(`${main_url}/updateitem`, newData);
      console.log(response.data);
      // Update the state with the updated item
      setItems(prevItems => {
        return prevItems.map(item => {
          if (item.id === id) {
            return { ...item, ...newData };
          }
          return item;
        });
      });
      return response.status;
    } catch {
      return 500;
    }
  };

  const addItem = async (newData) => {
    try {
      newData.id = uuidv4();
      const response= await axios.post(`${main_url}/additem`,newData);
      setItems(prevItems => [...prevItems, newData]);
      return response.status;
    } catch {
      return 500;
    }
  };

  const deleteItem = async (id) => {
    try {
      const response= await axios.delete(`${main_url}/deleteitem/${id}`)
      setItems(prevItems => prevItems.filter(item => item.id !== id));
      return response.status;
    } catch {
      return 500;
    }
  };

  const handleEdit = (product) => {
    setEditedProduct(product);
    setShowEditModal(true);
  };
  const handleDelete = (id) => {
    setDeleteItemId(id);
    setShowDeleteModal(true);
  };
  const handleSaveDelete = async () => {
    try {
      const response = await deleteItem(deleteItemId);

      if (response === 200) {
        setDeleteItemId("");
        setShowDeleteModal(false);
      } else {
        throw new Error(
          "Authentication failed. Please check your credentials."
        );
      }
    } catch (error) {
      // Hata durumunda
      console.error("Error:", error.message);
    }
  };

  const handleSaveEdit = async () => {
    try {
      const id = editedProduct.id;
      const response = await updateItemById(id, editedProduct);
      if (response === 200) {
        console.log("updated");
      } else {
        throw new Error(
          "Authentication failed. Please check your credentials."
        );
      }
    } catch (error) {
      // Hata durumunda
      console.error("Error:", error.message);
    }
    // onUpdate(editedProduct);
    setShowEditModal(false);
  };

  const handleAdd = () => {
    setShowAddModal(true);
  };

  const handleSaveAdd = async () => {
    try {
      const response = await addItem(newProduct);

      if (response === 200) {
        console.log("added");
      } else {
        throw new Error(
          "Authentication failed. Please check your credentials."
        );
      }
    } catch (error) {
      console.error("Error:", error.message);
    }
    // Clear the form fields
    setNewProduct({
      id: "",
      category: "",
      subcategory: "",
      title: "",
      desc: "",
      price: "",
      img: "",
    });
    setShowAddModal(false);
  };

  return (
    <Container>
      <Button className="m-1" variant="success" onClick={handleAdd}>
        Yeni ürün ekle
      </Button>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>ID</th>
            <th>Kategori</th>
            <th>Alt Kategori</th>
            <th>İsim</th>
            <th>Açıklama</th>
            <th>Fiyat</th>
            <th>Resim</th>
            <th>Aksiyonlar</th>
          </tr>
        </thead>
        <tbody>
          {items.map((product) => (
            <tr key={product.id}>
              <td>{product.id}</td>
              <td>{product.category}</td>
              <td>{product.subcategory}</td>
              <td>{product.title}</td>
              <td>{product.desc}</td>
              <td>{product.price}</td>
              <td>
                <img
                  src={"../." + product.img}
                  alt={product.title}
                  style={{ width: "50px" }}
                />
              </td>
              <td>
                <ButtonGroup>
                  <Button
                    className="m-1"
                    variant="primary"
                    onClick={() => handleEdit(product)}
                  >
                    Güncelle
                  </Button>
                  <Button
                    className="m-1"
                    variant="danger"
                    onClick={() => handleDelete(product.id)}
                  >
                    Sil
                  </Button>
                </ButtonGroup>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Ürün Güncelle</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formTitle">
              <Form.Label>İsim</Form.Label>
              <Form.Control
                type="text"
                placeholder="İsim Gir"
                value={editedProduct.title}
                onChange={(e) =>
                  setEditedProduct({ ...editedProduct, title: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group controlId="formCategory">
              <Form.Label>Kategori</Form.Label>
              <Form.Control
                type="text"
                placeholder="Kategori Gir"
                value={editedProduct.category}
                onChange={(e) =>
                  setEditedProduct({
                    ...editedProduct,
                    category: e.target.value,
                  })
                }
              />
            </Form.Group>
            <Form.Group controlId="formSubcategory">
              <Form.Label>Alt Kategori</Form.Label>
              <Form.Control
                type="text"
                placeholder="Alt Kategori Gir"
                value={editedProduct.subcategory}
                onChange={(e) =>
                  setEditedProduct({
                    ...editedProduct,
                    subcategory: e.target.value,
                  })
                }
              />
            </Form.Group>
            <Form.Group controlId="formDesc">
              <Form.Label>Açıklama</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Açıklama Gir"
                value={editedProduct.desc}
                onChange={(e) =>
                  setEditedProduct({ ...editedProduct, desc: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group controlId="formPrice">
              <Form.Label>Fiyat</Form.Label>
              <Form.Control
                type="text"
                placeholder="Fiyat Gir"
                value={editedProduct.price}
                onChange={(e) =>
                  setEditedProduct({ ...editedProduct, price: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group controlId="formImg">
              <Form.Label>Resim Yolu</Form.Label>
              <Form.Control
                type="text"
                placeholder="Resim Yolu Gir"
                value={editedProduct.img}
                onChange={(e) =>
                  setEditedProduct({ ...editedProduct, img: e.target.value })
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={handleSaveEdit}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Yeni ürün ekle</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formTitle">
              <Form.Label>İsim</Form.Label>
              <Form.Control
                type="text"
                placeholder="İsim Gir"
                value={newProduct.title}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, title: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group controlId="formCategory">
              <Form.Label>Kategori</Form.Label>
              <Form.Control
                type="text"
                placeholder="Kategori Gir"
                value={newProduct.category}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, category: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group controlId="formSubcategory">
              <Form.Label>Subcategory</Form.Label>
              <Form.Control
                type="text"
                placeholder="Alt Kategori Gir"
                value={newProduct.subcategory}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, subcategory: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group controlId="formDesc">
              <Form.Label>Açıklama</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Açıklama Gir"
                value={newProduct.desc}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, desc: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group controlId="formPrice">
              <Form.Label>Fiyat</Form.Label>
              <Form.Control
                type="text"
                placeholder="Fiyat Gir"
                value={newProduct.price}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, price: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group controlId="formImg">
              <Form.Label>Resim Yolu</Form.Label>
              <Form.Control
                type="text"
                placeholder="./images/resim.jpg"
                value={newProduct.img}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, img: e.target.value })
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            İptal
          </Button>
          <Button variant="primary" onClick={handleSaveAdd}>
            Ürün Ekle
          </Button>
        </Modal.Footer>
      </Modal>

      {/* delete Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Silme işlemini onayla</Modal.Title>
        </Modal.Header>
        <Modal.Body>Gerçekten ürünü silmek istiyor musunuz?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            İptal
          </Button>
          <Button variant="danger" onClick={handleSaveDelete}>
            Sil
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ProductTable;
