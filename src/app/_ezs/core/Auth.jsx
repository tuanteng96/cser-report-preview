import { useState, useEffect, createContext, useContext } from "react";
import { LayoutSplashScreen } from "./EzsSplashScreen";
import axios from "axios";

const AuthContext = createContext();

const useAuth = () => {
  return useContext(AuthContext);
};

if (import.meta.env.DEV) {
  window.top.Info = {
    User: {
      ID: 1,
      FullName: "Admin System",
    },
    Stocks: [
      {
        Title: "Quản lý cơ sở",
        ID: 778,
        ParentID: 0,
      },
      {
        Title: "Cser Hà Nội",
        ID: 11541,
        ParentID: 778,
      },
      {
        Title: "Cser Hồ Chí Minh",
        ID: 11542,
        ParentID: 778,
      },
    ],
    rightTree: {
      groups: [
        {
          group: "Báo cáo",
          rights: [
            {
              IsAllStock: true,
              hasRight: true,
              name: "report",
              reports: {
                groups: [
                  {
                    group: "Báo cáo ngày",
                    items: [
                      {
                        stocks: "",
                        text: "Tổng quan",
                        hasRight: true,
                        stocksList: [
                          {
                            Title: "Cser Hà Nội",
                            ID: 11541,
                          },
                          {
                            Title: "Cser Hồ Chí Minh",
                            ID: 11521,
                            ParentID: 11542,
                          },
                        ],
                        IsAllStock: false,
                      },
                      {
                        stocks: "",
                        text: "Khách hàng",
                      },
                    ],
                  },
                ],
              },
              stocksList: [
                {
                  Title: "Cser Hà Nội",
                  ID: 11541,
                },
                {
                  Title: "Cser Hồ Chí Minh",
                  ID: 11542,
                },
              ],
            },
          ],
        },
      ],
    },
    CrStockID: 11542,
    token:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJBdXRoMlR5cGUiOiJVc2VyRW50IiwiSUQiOiIxIiwiVG9rZW5JZCI6IjEyMjEzMzEyMjgxOSIsIm5iZiI6MTc0NTgwNzU0NiwiZXhwIjoxODMyMjA3NTQ2LCJpYXQiOjE3NDU4MDc1NDZ9.OrsG1xLiSDVHiTN3QWL9cmSUF2COMCyi5fBVxYbEgN4",
  };
}

const getInfoLocalStorage = () => {
  return new Promise(function (resolve) {
    function getInfo() {
      if (window.Info) {
        resolve({
          Auth: window.Info,
        });
      } else {
        setTimeout(() => {
          getInfo();
        }, 50);
      }
    }
    getInfo();
  });
};

const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [CrStocks, setCrStocks] = useState(null);
  const [Stocks, setStocks] = useState(null);
  const [RightTree, setRightTree] = useState(null);
  const [GlobalConfig, setGlobalConfig] = useState(null);

  const saveAuth = ({ CrStockID, token, User, rightTree, ...values }) => {
    let newStocks = values.Stocks
      ? values.Stocks.filter((x) => x.ParentID !== 0).map((x) => ({
          ...x,
          label: x.Title,
          value: x.ID,
        }))
      : [];
    let index = newStocks.findIndex((x) => x.ID === CrStockID);
    setAuth(User);
    setAccessToken(token);
    setStocks(newStocks);
    setRightTree(rightTree);

    if (index > -1) {
      setCrStocks(newStocks[index]);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        auth,
        accessToken,
        CrStocks,
        Stocks,
        RightTree,
        saveAuth,
        GlobalConfig,
        setGlobalConfig,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

const AuthInit = ({ children }) => {
  const { saveAuth, setGlobalConfig } = useAuth();
  const [showSplashScreen, setShowSplashScreen] = useState(true);

  useEffect(() => {
    getInfoLocalStorage().then(({ Auth }) => {
      setShowSplashScreen(false);
      saveAuth(Auth);
    });

    axios
      .get(
        (import.meta.env.MODE === "development"
          ? import.meta.env.VITE_HOST
          : window.location.origin) +
          "/brand/global/global.json?" +
          new Date().getTime()
      )
      .then(({ data }) => {
        if (data) {
          setGlobalConfig(data);
        }
      });
    // eslint-disable-next-line
  }, []);

  return showSplashScreen ? <LayoutSplashScreen /> : <>{children}</>;
};

export { AuthProvider, AuthInit, useAuth };
