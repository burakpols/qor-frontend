import React, { useState } from "react";
import "./AdminStyle.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from 'react-router-dom';

const AdminPage = () => {
  const users = [
    {
      id: 1,
      username: "mihman",
      password: "Mihman123!",
      role: "admin",
    },
  ];
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  

  const handleUsernameChange = (event) => {
    setUsername(event.target.value);
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {

      const user = users.find((u) => {
        return u.username === username && u.password === password;
      });
    
      if (user) {
        navigate('/admin/dashboard/zAwbAcPVXTIGwdSIIHXXYKehz3OANhWZ');
      }else{
        throw new Error("Authentication failed. Please check your credentials.");

      }
  } catch (error) {
      // Hata durumunda
      console.error("Error:", error.message);
      // Hata durumunu bileşeninizin durumuna kaydedebilirsiniz
      setError("Kullanıcı Adınızı ve parolanızı kontrol edin.");
  }
  };

  return (
    <section className="vh-100 gradient-custom">
      <div className="container py-5 h-100">
        <div className="row d-flex justify-content-center align-items-center h-100">
          <div className="col-12 col-md-8 col-lg-6 col-xl-5">
            <div
              className="card bg-dark text-white"
              style={{ borderRadius: "1rem" }}
            >
              <div className="card-body p-5 text-center">
                <div className="mb-md-5 mt-md-4 pb-5">
                  <h2 className="fw-bold mb-2 text-uppercase">
                    MİHMAN KAFE ADMİN
                  </h2>
                  <p className="text-white-50 mb-5">
                    Lütfen kullanıcı adınızı ve parolanızı girin.
                  </p>
                  <form onSubmit={handleSubmit}>
                    <div className="form-outline form-white mb-4">
                      <input
                        type="text"
                        id="username"
                        className="form-control form-control-lg"
                        value={username}
                        onChange={handleUsernameChange}
                        placeholder="Kullanıcı Adı"
                      />
                    </div>
                    <div className="form-outline form-white mb-4">
                      <input
                        type="password"
                        id="password"
                        className="form-control form-control-lg"
                        value={password}
                        onChange={handlePasswordChange}
                        placeholder="Parola"
                      />
                    </div>
                    <button
                      className="btn btn-outline-light btn-lg px-5"
                      type="submit"
                    >
                      Giriş
                    </button>
                    {error && <p className="text-danger mt-3">{error}</p>}
                  </form>
                  <div className="d-flex justify-content-center text-center mt-4 pt-1">
                    <a href="#!" className="text-white">
                      <i className="fab fa-facebook-f fa-lg"></i>
                    </a>
                    <a href="#!" className="text-white">
                      <i className="fab fa-twitter fa-lg mx-4 px-2"></i>
                    </a>
                    <a href="#!" className="text-white">
                      <i className="fab fa-google fa-lg"></i>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdminPage;
