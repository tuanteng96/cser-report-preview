import React, { useEffect, useMemo, useState } from "react";
import { FloatingPortal } from "@floating-ui/react";
import { Dialog } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, LayoutGroup, m } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useRoles } from "src/app/_ezs/hooks/useRoles";
import moment from "moment";
import http from "src/app/_ezs/utils/http";
import ReactBaseTable from "src/app/_ezs/partials/table";
import { formatString } from "src/app/_ezs/utils/formatString";

function PickerViews({ children, group, item, api }) {
  let [visible, setVisible] = useState(false);
  const { report, bao_cao_ngay_tong_quan } = useRoles([
    "bao_cao_ngay_tong_quan",
    "report",
  ]);

  const { isLoading, data } = useQuery({
    queryKey: [item?.Key || group?.GroupTitle, api?.filter],
    queryFn: async () => {
      let Stocks = bao_cao_ngay_tong_quan?.hasRight
        ? bao_cao_ngay_tong_quan?.StockRoles
        : report.StockRoles;
      let newFilters = {
        ...api?.filter,
        DateStart: api?.filter?.CrDate
          ? moment(api?.filter?.CrDate).format("DD/MM/YYYY")
          : null,
        DateEnd: api?.filter?.CrDate
          ? moment(api?.filter?.CrDate).format("DD/MM/YYYY")
          : null,
        StockID:
          api?.filter?.StockID && api?.filter?.StockID.length > 0
            ? api?.filter?.StockID
            : Stocks.map((x) => x.ID),
      };
      let { data } = await http.post(api?.path, JSON.stringify(newFilters));
      let rs = [];
      if (data?.result?.List?.length > 0) {
        for (let item of data?.result?.List) {
          if (item && item.length > 0) {
            for (let x of item) {
              rs.push(x);
            }
          }
        }
      }
      return rs;
    },
    enabled: visible,
  });

  const columns = useMemo(
    () => {
      let clms = [];
      if (data && data.length > 0) {
        for (const [key, value] of Object.entries(data[0])) {
          let obj = {
            key: key,
            title: key,
            dataKey: key,
            width: 250,
            sortable: false,
          };
          if (key.includes("Date")) {
            obj["cellRenderer"] = ({ rowData }) =>
              rowData[key] ? moment(rowData[key]).format("DD-MM-YYYY") : "";
          }
          if (["Pay", "TM", "CK", "QT", "The_tien", "Vi", "Con_no", "DVPP"].some((x) => key.includes(x))) {
            obj["cellRenderer"] = ({ rowData }) => formatString.formatVNDPositive(rowData[key]);
          }
          clms.push(obj);
        }
      }
      return clms;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data]
  );

  const onHide = () => {
    setVisible(false);
  };

  return (
    <>
      {children({
        open: () => setVisible(true),
        close: onHide,
      })}
      <AnimatePresence>
        {visible && (
          <FloatingPortal>
            <LayoutGroup>
              <Dialog open={visible} onClose={onHide}>
                <div
                  className="fixed inset-0 flex items-center justify-center z-[1003]"
                  autoComplete="off"
                >
                  <m.div
                    className="absolute flex flex-col justify-center w-full h-full md:px-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Dialog.Panel
                      tabIndex={0}
                      className="flex flex-col w-full h-full bg-white rounded shadow-lg"
                    >
                      <Dialog.Title className="relative flex justify-between px-5 py-4 border-b md:py-5 border-light">
                        <div className="text-lg font-bold md:text-2xl">
                          {item?.Key || group?.GroupTitle}
                        </div>
                        <div
                          className="absolute flex items-center justify-center w-12 h-12 cursor-pointer right-2 top-2/4 -translate-y-2/4"
                          onClick={onHide}
                        >
                          <XMarkIcon className="w-6 md:w-8" />
                        </div>
                      </Dialog.Title>
                      <ReactBaseTable
                        fixed
                        wrapClassName="grow p-5"
                        rowKey="ID"
                        columns={columns}
                        data={data || []}
                        rowHeight={70}
                        isPreviousData={false}
                        loading={isLoading}
                        footerClass="flex items-center justify-between w-full px-5 pb-5"
                      />
                    </Dialog.Panel>
                  </m.div>
                </div>
              </Dialog>
            </LayoutGroup>
          </FloatingPortal>
        )}
      </AnimatePresence>
    </>
  );
}

export default PickerViews;
