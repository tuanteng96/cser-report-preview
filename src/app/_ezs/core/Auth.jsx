import { useState, useEffect, createContext, useContext } from "react";
import { LayoutSplashScreen } from "./EzsSplashScreen";

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
        ID: 11409,
        ParentID: 778,
      },
      {
        Title: "Cser Hồ Chí Minh",
        ID: 11410,
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
                            ID: 11409,
                          },
                          {
                            Title: "Cser Hồ Chí Minh",
                            ID: 11410,
                            ParentID: 778,
                          }
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
                  ID: 11409,
                },
                {
                  Title: "Cser Hồ Chí Minh",
                  ID: 11410,
                },
              ],
            },
          ],
        },
      ],
    },
    CrStockID: 11409,
    token:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJBdXRoMlR5cGUiOiJVc2VyRW50IiwiSUQiOiIxIiwiVG9rZW5JZCI6IjEwNjEzMzEwNjUxNiIsIm5iZiI6MTcyODk2MTkzNiwiZXhwIjoxODE1MzYxOTM2LCJpYXQiOjE3Mjg5NjE5MzZ9.PAv6K70ykXm_IN3iu_Vyd0EL5WH2lJ9LLoaYU7KLaJA',
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

const AuthInit = ({ children }) => {
  const { saveAuth } = useAuth();
  const [showSplashScreen, setShowSplashScreen] = useState(true);

  useEffect(() => {
    getInfoLocalStorage().then(({ Auth }) => {
      setShowSplashScreen(false);
      saveAuth(Auth);
    });
    // eslint-disable-next-line
  }, []);

  return showSplashScreen ? <LayoutSplashScreen /> : <>{children}</>;
};

export { AuthProvider, AuthInit, useAuth };
