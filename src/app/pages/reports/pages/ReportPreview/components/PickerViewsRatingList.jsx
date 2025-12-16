import React, { Fragment, useEffect, useMemo, useState } from "react";
import { FloatingPortal } from "@floating-ui/react";
import { Dialog } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, LayoutGroup, m } from "framer-motion";
import { useInfiniteQuery } from "@tanstack/react-query";
import moment from "moment";
import ReactBaseTable from "src/app/_ezs/partials/table";
import { formatString } from "src/app/_ezs/utils/formatString";
import { useWindowSize } from "src/app/_ezs/hooks/useWindowSize";
import { PickerViewMobile } from ".";
import { SpinnerComponent } from "src/app/_ezs/components/spinner";
import Text from "react-texty";
import ReportsAPI from "src/app/_ezs/api/reports.api";
import { formatArray } from "src/app/_ezs/utils/formatArray";
import { Button } from "src/app/_ezs/partials/button";
import excelGG from "src/app/_ezs/utils/excelGG";
import { toast } from "react-toastify";

function PickerViewsRatingList({ children, keyID }) {
  let [visible, setVisible] = useState(false);
  let [view, setView] = useState(null);
  let [isExport, setIsExport] = useState(false);

  const { width } = useWindowSize();

  let getParams = ({ Ps = 20, Pi = 1 }) => {
    let Value = 0;
    let FeedBackStatus = "";

    if (keyID === "Value") {
      Value = view.index;
    }

    if (keyID === "FeedBackStatus") {
      FeedBackStatus = "";
    }

    let newFilters = {
      ps: Ps,
      pi: Pi,
      filter: {
        CreateDate: [
          moment(view.filters.DateStart)
            .set({
              hour: 0,
              minute: 0,
            })
            .format("YYYY-MM-DD HH:mm"),
          moment(view.filters.DateEnd)
            .set({
              hour: 23,
              minute: 59,
            })
            .format("YYYY-MM-DD HH:mm"),
        ],
        StockID: view.filters.StockID?.value,
        Value: Value,
        Status: "",
        FeedBackStatus: FeedBackStatus,
        "OSJSON.$.ServiceID": 0,
        MemberID: 0,
        UserID: 0,
      },
      ignoreFilter: {
        StockID: 0,
        Value: 0,
        Status: "",
        FeedBackStatus: "",
        "OSJSON.$.ServiceID": 0,
        MemberID: 0,
        UserID: 0,
      },
    };
    return newFilters;
  };

  const { isLoading, data, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: ["viewRating" + view?.index],
      queryFn: async ({ pageParam = 1 }) => {
        let newFilters = getParams({
          Pi: pageParam,
        });

        let { data } = await ReportsAPI.viewRating(newFilters);
        return data;
      },
      getNextPageParam: (lastPage, pages) =>
        lastPage.pi === lastPage.pcount ? undefined : lastPage.pi + 1,
      enabled: visible,
    });

  const columns = useMemo(
    () => {
      return [
        {
          key: "STT",
          title: "STT",
          dataKey: "STT",
          width: 80,
          cellRenderer: ({ rowIndex }) => rowIndex + 1,
          sortable: false,
        },
        {
          key: "CreateDate",
          title: "Ngày giờ",
          dataKey: "CreateDate",
          cellRenderer: ({ rowData }) =>
            moment(rowData.CreateDate).format("HH:mm DD/MM/YYYY"),
          width: 180,
          sortable: false,
        },
        {
          key: "MemberJSON",
          title: "Tên khách hàng",
          dataKey: "MemberJSON",
          cellRenderer: ({ rowData }) => {
            let Member = rowData?.MemberJSON
              ? JSON.parse(rowData?.MemberJSON)
              : null;
            return Member?.FullName;
          },
          width: 260,
          sortable: false,
        },
        {
          key: "MemberJSONPhone",
          title: "Số điện thoại",
          dataKey: "MemberJSONPhone",
          cellRenderer: ({ rowData }) => {
            let Member = rowData?.MemberJSON
              ? JSON.parse(rowData?.MemberJSON)
              : null;
            return Member?.Phone;
          },
          width: 200,
          sortable: false,
        },
        {
          key: "UserJSON",
          title: view?.index === 3 ? "KTV bị chặn" : "KTV thực hiện",
          dataKey: "UserJSON",
          cellRenderer: ({ rowData }) => {
            let User = rowData?.UserJSON ? JSON.parse(rowData?.UserJSON) : null;
            return User?.FullName;
          },
          width: 260,
          sortable: false,
        },
        {
          key: "OSJSON",
          title: "Dịch vụ",
          dataKey: "OSJSON",
          cellRenderer: ({ rowData }) => {
            let Os = rowData?.OSJSON ? JSON.parse(rowData?.OSJSON) : null;
            return Os?.ServiceTitle;
          },
          width: 300,
          sortable: false,
        },
        {
          key: "FeedBackStatus",
          title: "Trạng thái",
          dataKey: "FeedBackStatus",
          cellRenderer: ({ rowData }) => {
            return rowData?.FeedBackStatus === "0" ? (
              <div className="font-medium text-danger">Mới (New)</div>
            ) : (
              <div className="font-medium text-success">Đã xong (Resolved)</div>
            );
          },
          width: 200,
          sortable: false,
          hidden: view?.index !== 2,
        },
      ];
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data]
  );

  const onHide = () => {
    setIsExport(false);
    setView(null);
    setVisible(false);
  };

  const Lists = formatArray.useInfiniteQuery(data?.pages, "items");

  const onExport = async () => {
    if (data.pages && data.pages.length > 0) {
      setIsExport(true);

      let newFilters = getParams({
        Ps: data.pages[0]?.total || 1,
      });

      let rs = await ReportsAPI.viewRating(newFilters);

      excelGG.dataToExcel(
        view?.label +
          ` (${moment(view?.filters.DateStart).format("DD/MM/YYYY")} - ${moment(
            view?.filters.DateEnd
          ).format("DD/MM/YYYY")})`,
        (sheet, workbook) => {
          workbook.suspendPaint();
          workbook.suspendEvent();

          let Head = [
            "STT",
            "NGÀY GIỜ",
            "TÊN KHÁCH HÀNG",
            "SỐ ĐIỆN THOẠI",
            view?.index === 3 ? "KTV BỊ CHẶN" : "KTV THỰC HIỆN",
            "DỊCH VỤ",
          ];
          if (view?.index === 2) {
            Head.push("TRẠNG THÁI");
          }
          let Response = [Head];
          let index = 0;
          for (let rowData of rs?.data?.items) {
            index += 1;
            let Member = rowData?.MemberJSON
              ? JSON.parse(rowData?.MemberJSON)
              : null;
            let User = rowData?.UserJSON ? JSON.parse(rowData?.UserJSON) : null;
            let Os = rowData?.OSJSON ? JSON.parse(rowData?.OSJSON) : null;

            let FeedBackStatus = "Mới (New)";

            if (rowData?.FeedBackStatus === "1") {
              FeedBackStatus = "Đã xong (Resolved)";
            }

            let newArray = [
              index,
              moment(rowData.CreateDate).format("HH:mm DD/MM/YYYY"),
              Member?.FullName,
              Member?.Phone,
              User?.FullName,
              Os?.ServiceTitle,
            ];

            if (view?.index === 2) {
              newArray.push(FeedBackStatus);
            }

            Response.push(newArray);
          }

          let TotalRow = Response.length;
          let TotalColumn = Head.length;

          sheet.setArray(2, 0, Response);

          //title
          workbook
            .getActiveSheet()
            .getCell(0, 0)
            .value(
              view?.label +
                ` (${moment(view?.filters.DateStart).format(
                  "DD/MM/YYYY"
                )} - ${moment(view?.filters.DateEnd).format("DD/MM/YYYY")})`
            );
          workbook.getActiveSheet().getCell(0, 0).font("18pt Arial");

          workbook
            .getActiveSheet()
            .getRange(2, 0, 1, TotalColumn)
            .font("12pt Arial");
          workbook
            .getActiveSheet()
            .getRange(2, 0, 1, TotalColumn)
            .backColor("#E7E9EB");
          //border
          var border = new window.GC.Spread.Sheets.LineBorder();
          border.color = "#000";
          border.style = window.GC.Spread.Sheets.LineStyle.thin;
          workbook
            .getActiveSheet()
            .getRange(2, 0, TotalRow, TotalColumn)
            .borderLeft(border);
          workbook
            .getActiveSheet()
            .getRange(2, 0, TotalRow, TotalColumn)
            .borderRight(border);
          workbook
            .getActiveSheet()
            .getRange(2, 0, TotalRow, TotalColumn)
            .borderBottom(border);
          workbook
            .getActiveSheet()
            .getRange(2, 0, TotalRow, TotalColumn)
            .borderTop(border);
          //filter
          var cellrange = new window.GC.Spread.Sheets.Range(
            3,
            0,
            1,
            TotalColumn
          );
          var hideRowFilter = new window.GC.Spread.Sheets.Filter.HideRowFilter(
            cellrange
          );
          workbook.getActiveSheet().rowFilter(hideRowFilter);

          //format number
          workbook
            .getActiveSheet()
            .getCell(2, 0)
            .hAlign(window.GC.Spread.Sheets.HorizontalAlign.center);

          //auto fit width and height
          workbook.getActiveSheet().autoFitRow(TotalRow + 2);
          workbook.getActiveSheet().autoFitRow(0);

          for (let i = 1; i < TotalColumn; i++) {
            workbook.getActiveSheet().autoFitColumn(i);
          }

          setIsExport(false);

          //Finish
          workbook.resumePaint();
          workbook.resumeEvent();
        }
      );
    } else {
      toast.warning("Không có dữ liệu xuất Excel.");
    }
  };

  return (
    <>
      {children({
        open: (v) => {
          setView(v);
          setVisible(true);
        },
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
                      <Dialog.Title className="relative flex items-center justify-between px-5 py-4 border-b md:py-5 border-light">
                        <div className="text-lg font-bold md:text-2xl">
                          {view?.label}
                        </div>
                        <div className="flex gap-3">
                          <Button
                            hideText={isExport}
                            disabled={isExport}
                            loading={isExport}
                            onClick={onExport}
                            type="button"
                            className="hidden h-[42px] text-sm lg:flex items-center justify-center bg-primary text-white px-4 rounded cursor-pointer relative"
                          >
                            Xuất Excel
                          </Button>
                          <div className="w-[1px] h-[42px] bg-gray-300"></div>
                          <div
                            className="flex items-center justify-center w-12 h-[42px] cursor-pointer"
                            onClick={onHide}
                          >
                            <XMarkIcon className="w-6 md:w-8" />
                          </div>
                        </div>
                      </Dialog.Title>
                      <ReactBaseTable
                        fixed
                        wrapClassName="grow p-5"
                        rowKey="ID"
                        columns={columns}
                        data={Lists || []}
                        rowHeight={65}
                        loading={isLoading}
                        disabled={isLoading}
                        loadingMore={isFetchingNextPage}
                        onEndReachedThreshold={50}
                        onEndReached={() => {
                          if (isLoading) return;
                          if (isFetchingNextPage) return;
                          if (!hasNextPage) return;

                          fetchNextPage();
                        }}
                        footerClass="flex items-center justify-between w-full px-5 pb-5"
                        ignoreFunctionInColumnCompare={false}
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

export default PickerViewsRatingList;
