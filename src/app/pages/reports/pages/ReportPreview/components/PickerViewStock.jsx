import React, {
  forwardRef,
  Fragment,
  useEffect,
  useMemo,
  useState,
} from "react";
import { FloatingPortal } from "@floating-ui/react";
import { Dialog } from "@headlessui/react";
import { ArrowUpIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, LayoutGroup, m } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useRoles } from "src/app/_ezs/hooks/useRoles";
import moment from "moment";
import ReactBaseTable from "src/app/_ezs/partials/table";
import { formatString } from "src/app/_ezs/utils/formatString";
import { useWindowSize } from "src/app/_ezs/hooks/useWindowSize";
import { PickerViewMobile } from ".";
import { SpinnerComponent } from "src/app/_ezs/components/spinner";
import ReportsAPI from "src/app/_ezs/api/reports.api";
import { InputDatePicker } from "src/app/_ezs/partials/forms";
import { formatArray } from "src/app/_ezs/utils/formatArray";
import { Controller, useForm } from "react-hook-form";
import { Button } from "src/app/_ezs/partials/button";
import clsx from "clsx";

const PickerViewStock = forwardRef((props, ref) => {
  let { children, onClose, ...rest } = props;

  let [visible, setVisible] = useState(false);
  let [Lists, setLists] = useState([]);
  const [filters, setFilters] = useState({
    StockID: [],
    DateStart: moment().toDate(),
    DateEnd: moment().toDate(),
    Pi: 1,
    Ps: 100,
  });
  let [sortState, setSortState] = useState({
    Cash: "asc",
    MM: "asc",
    MMbook: "asc",
    Os: "asc",
  });
  const { report, bao_cao_ngay_tong_quan } = useRoles([
    "bao_cao_ngay_tong_quan",
    "report",
  ]);

  const { width } = useWindowSize();

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      DateStart: filters.DateStart,
      DateEnd: filters.DateEnd,
    },
  });

  const { isLoading, data } = useQuery({
    queryKey: ["ViewStock", { ...filters }],
    queryFn: async () => {
      let Stocks = bao_cao_ngay_tong_quan?.hasRight
        ? bao_cao_ngay_tong_quan?.StockRoles
        : report.StockRoles;
      let newFilters = {
        ...filters,
        DateStart: filters.DateStart
          ? moment(filters.DateStart).format("YYYY/MM/DD")
          : null,
        DateEnd: filters.DateEnd
          ? moment(filters.DateEnd).format("YYYY/MM/DD")
          : null,
        StockID:
          filters.StockID && filters.StockID.length > 0
            ? filters?.StockID
            : Stocks.map((x) => x.ID),
      };
      let { data } = await ReportsAPI.viewStock(newFilters);
      return data?.result?.Items || [];
    },
    enabled: visible,
  });

  useEffect(() => {
    setLists(data);
  }, [data]);

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
          key: "StockTitle",
          title: "Tên cửa hàng",
          dataKey: "StockTitle",
          width: 350,
          sortable: false,
        },
        {
          key: "Cash",
          title: "TM / CK / QT",
          dataKey: "Cash",
          cellRenderer: ({ rowData }) => (
            <div>
              {formatString.formatVND(rowData.Cash)}
              <span className="pl-1">
                (
                {rowData?.Cash ? (
                  <>
                    {Math.round(
                      (rowData?.Cash / formatArray.sumTotal(data, "Cash")) *
                        100 *
                        100
                    ) / 100}
                    %
                  </>
                ) : (
                  "0%"
                )}
                )
              </span>
            </div>
          ),
          width: 250,
          sortable: true,
        },
        {
          key: "MM",
          title: "Ví / Thẻ tiền",
          dataKey: "MM",
          cellRenderer: ({ rowData }) => (
            <div>
              {formatString.formatVND(rowData.MM)}
              <span className="pl-1">
                (
                {rowData?.MM ? (
                  <>
                    {Math.round(
                      (rowData?.MM / formatArray.sumTotal(data, "MM")) *
                        100 *
                        100
                    ) / 100}
                    %
                  </>
                ) : (
                  "0%"
                )}
                )
              </span>
            </div>
          ),
          width: 250,
          sortable: true,
        },
        {
          key: "MMbook",
          title: "Đặt lịch",
          dataKey: "MMbook",
          cellRenderer: ({ rowData }) => (
            <div>
              {rowData.MMbook || 0}
              <span className="pl-1">
                (
                {rowData?.MMbook ? (
                  <>
                    {Math.round(
                      (rowData?.MMbook / formatArray.sumTotal(data, "MMbook")) *
                        100 *
                        100
                    ) / 100}
                    %
                  </>
                ) : (
                  "0%"
                )}
                )
              </span>
            </div>
          ),
          width: 200,
          sortable: true,
        },
        {
          key: "Os",
          title: "Dịch vụ",
          dataKey: "Os",
          cellRenderer: ({ rowData }) => (
            <div>
              {rowData.Os || 0}
              <span className="pl-1">
                (
                {rowData?.Os ? (
                  <>
                    {Math.round(
                      (rowData?.Os / formatArray.sumTotal(data, "Os")) *
                        100 *
                        100
                    ) / 100}
                    %
                  </>
                ) : (
                  "0%"
                )}
                )
              </span>
            </div>
          ),
          width: 200,
          sortable: true,
        },
      ];
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data]
  );

  const onHide = () => {
    setVisible(false);
    onClose && onClose();
  };

  const onColumnSort = ({ key, order }) => {
    let newItems = [...(Lists || [])];
    if (order === "desc") {
      newItems = newItems.sort((a, b) => a[key] - b[key]);
    } else {
      newItems = newItems.sort((a, b) => b[key] - a[key]);
    }

    setLists(newItems);

    let newSortState = JSON.parse(JSON.stringify(sortState));
    newSortState[key] = order;
    setSortState(newSortState);
  };

  const onSubmit = (values) => {
    setFilters((prevState) => ({
      ...prevState,
      ...values,
    }));
  };
  if (width > 767) {
    return (
      <>
        {children({
          open: () => {
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
                        <Dialog.Title className="relative flex items-center justify-between px-5 py-3 border-b md:py-4 border-light">
                          <div className="text-lg font-bold md:text-2xl">
                            Báo cáo tổng quan theo cơ sở
                          </div>
                          <form
                            onSubmit={handleSubmit(onSubmit)}
                            className="flex items-center"
                            autoComplete="off"
                          >
                            <div className="flex gap-3">
                              <div className="w-[150px]">
                                <Controller
                                  name="DateStart"
                                  control={control}
                                  render={({
                                    field: { ref, ...field },
                                    fieldState,
                                  }) => (
                                    <InputDatePicker
                                      className="!py-2.5"
                                      //popperPlacement='top-start'
                                      placeholderText="Từ ngày"
                                      autoComplete="off"
                                      onChange={field.onChange}
                                      selected={
                                        field.value
                                          ? new Date(field.value)
                                          : null
                                      }
                                      dateFormat="dd/MM/yyyy"
                                    />
                                  )}
                                />
                              </div>
                              <div className="flex items-center">-</div>
                              <div className="w-[150px]">
                                <Controller
                                  name="DateEnd"
                                  control={control}
                                  render={({
                                    field: { ref, ...field },
                                    fieldState,
                                  }) => (
                                    <InputDatePicker
                                      className="!py-2.5"
                                      //popperPlacement='top-start'
                                      placeholderText="Đến ngày"
                                      autoComplete="off"
                                      onChange={field.onChange}
                                      selected={
                                        field.value
                                          ? new Date(field.value)
                                          : null
                                      }
                                      dateFormat="dd/MM/yyyy"
                                    />
                                  )}
                                />
                              </div>
                              <Button
                                hideText={isLoading}
                                disabled={isLoading}
                                loading={isLoading}
                                type="submit"
                                className="h-[46px] flex items-center justify-center bg-primary text-white px-4 rounded cursor-pointer relative"
                              >
                                Lọc
                              </Button>
                            </div>
                            <div className="w-[1px] h-[46px] bg-gray-300 ml-4 mr-2"></div>
                            <div
                              className="flex items-center justify-center w-12 h-[46px] cursor-pointer"
                              onClick={onHide}
                            >
                              <XMarkIcon className="w-6 md:w-8" />
                            </div>
                          </form>
                        </Dialog.Title>

                        <ReactBaseTable
                          fixed
                          wrapClassName="grow p-5"
                          rowKey="StockID"
                          columns={columns}
                          data={Lists || []}
                          rowHeight={70}
                          isPreviousData={false}
                          loading={isLoading}
                          footerClass="flex items-center justify-between w-full px-5 pb-5"
                          sortState={sortState}
                          onColumnSort={onColumnSort}
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
                      className="relative flex flex-col w-full h-full bg-white rounded shadow-lg"
                    >
                      <Dialog.Title className="relative flex justify-between px-5 py-4 border-b md:py-5 border-light">
                        <div className="text-lg font-bold md:text-2xl">
                          Tổng quan theo cơ sở
                        </div>
                        <div
                          className="absolute flex items-center justify-center w-12 h-12 cursor-pointer right-2 top-2/4 -translate-y-2/4"
                          onClick={onHide}
                        >
                          <XMarkIcon className="w-6 md:w-8" />
                        </div>
                      </Dialog.Title>
                      <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="flex flex-col p-4"
                        autoComplete="off"
                      >
                        <div className="flex gap-2">
                          <div className="w-[125px]">
                            <Controller
                              name="DateStart"
                              control={control}
                              render={({
                                field: { ref, ...field },
                                fieldState,
                              }) => (
                                <InputDatePicker
                                  className="!py-2.5"
                                  //popperPlacement='top-start'
                                  placeholderText="Từ ngày"
                                  autoComplete="off"
                                  onChange={field.onChange}
                                  selected={
                                    field.value ? new Date(field.value) : null
                                  }
                                  dateFormat="dd/MM/yyyy"
                                />
                              )}
                            />
                          </div>
                          <div className="flex items-center">-</div>
                          <div className="w-[125px]">
                            <Controller
                              name="DateEnd"
                              control={control}
                              render={({
                                field: { ref, ...field },
                                fieldState,
                              }) => (
                                <InputDatePicker
                                  className="!py-2.5"
                                  //popperPlacement='top-start'
                                  placeholderText="Đến ngày"
                                  autoComplete="off"
                                  onChange={field.onChange}
                                  selected={
                                    field.value ? new Date(field.value) : null
                                  }
                                  dateFormat="dd/MM/yyyy"
                                />
                              )}
                            />
                          </div>
                          <Button
                            hideText={isLoading}
                            disabled={isLoading}
                            loading={isLoading}
                            type="submit"
                            className="h-[46px] flex items-center justify-center bg-primary text-white px-4 rounded cursor-pointer relative"
                          >
                            Lọc
                          </Button>
                        </div>
                        <div className="text-[13px] mt-2 gap-2.5 flex">
                          {[
                            {
                              key: "Cash",
                              Title: "TM/CK/QT",
                            },
                            {
                              key: "MM",
                              Title: "Ví/Thẻ tiền",
                            },
                            {
                              key: "MMbook",
                              Title: "Đặt lịch",
                            },
                            {
                              key: "Os",
                              Title: "Dịch vụ",
                            },
                          ].map((sort, i) => (
                            <span
                              className="flex text-primary"
                              key={i}
                              onClick={() =>
                                onColumnSort({
                                  key: sort.key,
                                  order:
                                    sortState[sort.key] === "desc"
                                      ? "asc"
                                      : "desc",
                                })
                              }
                            >
                              {sort.Title}
                              <ArrowUpIcon
                                className={clsx(
                                  "w-3.5 ml-px transition-all",
                                  sortState[sort.key] === "desc" && "rotate-180"
                                )}
                              />
                            </span>
                          ))}
                        </div>
                      </form>
                      <SpinnerComponent
                        bgClassName="bg-white"
                        top="top-[125px]"
                        height="h-[calc(100%-125px)]"
                        loading={isLoading}
                      />
                      <div className="px-4 pb-4 overflow-auto grow">
                        {Lists &&
                          Lists.length > 0 &&
                          Lists.map((row, index) => (
                            <div
                              className="mb-4 border rounded last:mb-0 shadow-xxl"
                              key={index}
                            >
                              {columns &&
                                columns.slice(0, 6).map((cell, i) => (
                                  <Fragment key={i}>
                                    <div className="flex justify-between border-b last:bottom-0 text-[14px] leading-6">
                                      <div className="p-3 w-[135px] text-[#6c7293] font-light">
                                        {cell.title}
                                      </div>
                                      <div className="flex-1 p-3 font-semibold text-right">
                                        {typeof cell.cellRenderer !== "function"
                                          ? row[cell.dataKey]
                                          : cell.cellRenderer({
                                              rowData: {
                                                ...row,
                                                rowIndex: index,
                                              },
                                              rowIndex: index,
                                            })}
                                      </div>
                                    </div>
                                  </Fragment>
                                ))}
                              {columns && columns.length > 6 && (
                                <PickerViewMobile columns={columns} row={row}>
                                  {({ open }) => (
                                    <div
                                      className="flex justify-between border-b last:bottom-0 text-[14px] leading-6"
                                      onClick={open}
                                    >
                                      <div className="p-3 w-[135px] text-[#6c7293] font-light">
                                        ... + {columns.length - 4}
                                      </div>
                                      <div className="flex items-center justify-end flex-1 px-3 text-right">
                                        <button
                                          className="bg-primary text-white text-[13px] leading-5 px-3 py-1.5 rounded font-light"
                                          type="button"
                                        >
                                          Xem chi tiết
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </PickerViewMobile>
                              )}
                            </div>
                          ))}
                        {(!Lists || Lists.length === 0) && (
                          <div className="flex flex-col items-center justify-center h-full dark:bg-dark-aside">
                            <svg
                              className="w-16"
                              viewBox="0 0 56 60"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <g fillRule="evenodd">
                                <path
                                  d="M1 14c-.55228475 0-1-.4477153-1-1s.44771525-1 1-1h42c.5522847 0 1 .4477153 1 1s-.4477153 1-1 1H1zM15 22c-.5522847 0-1-.4477153-1-1s.4477153-1 1-1h22c.5522847 0 1 .4477153 1 1s-.4477153 1-1 1H15zM17 6c-.5522847 0-1-.44771525-1-1s.4477153-1 1-1h10c.5522847 0 1 .44771525 1 1s-.4477153 1-1 1H17zM13 10c-.5522847 0-1-.44771525-1-1s.4477153-1 1-1h18c.5522847 0 1 .44771525 1 1s-.4477153 1-1 1H13zM36 8h7c.5522847 0 1 .44771525 1 1s-.4477153 1-1 1h-8c-.5522847 0-1-.44771525-1-1V1c0-.55228475.4477153-1 1-1s1 .44771525 1 1v7zM7 24c-.55228475 0-1-.4477153-1-1v-4c0-.5522847.44771525-1 1-1h4c.5522847 0 1 .4477153 1 1v4c0 .5522847-.4477153 1-1 1H7zm1-2h2v-2H8v2zM15 30c-.5522847 0-1-.4477153-1-1s.4477153-1 1-1h6.052c.5522847 0 1 .4477153 1 1s-.4477153 1-1 1H15zM7 32c-.55228475 0-1-.4477153-1-1v-4c0-.5522847.44771525-1 1-1h4c.5522847 0 1 .4477153 1 1v4c0 .5522847-.4477153 1-1 1H7zm1-2h2v-2H8v2zM15 38c-.5522847 0-1-.4477153-1-1s.4477153-1 1-1h4c.5522847 0 1 .4477153 1 1s-.4477153 1-1 1h-4zM7 40c-.55228475 0-1-.4477153-1-1v-4c0-.5522847.44771525-1 1-1h4c.5522847 0 1 .4477153 1 1v4c0 .5522847-.4477153 1-1 1H7zm1-2h2v-2H8v2zM15 46c-.5522847 0-1-.4477153-1-1s.4477153-1 1-1h7.624c.5522847 0 1 .4477153 1 1s-.4477153 1-1 1H15zM7 48c-.55228475 0-1-.4477153-1-1v-4c0-.5522847.44771525-1 1-1h4c.5522847 0 1 .4477153 1 1v4c0 .5522847-.4477153 1-1 1H7zm1-2h2v-2H8v2zM50.4161068 57.3851932c.8194757.8194757 2.1493107.8194757 2.9690786-.000292.8200861-.819409.8200861-2.1487934-.0003531-2.9685554l-5.8009391-5.801939c-.8194757-.8194757-2.1493107-.8194757-2.9687864 0-.8204757.8204757-.8204757 2.1493107 0 2.9697864l5.801 5.801zm-1.4142136 1.4142136l-5.801-5.801c-1.6015243-1.6015243-1.6015243-4.1966893 0-5.7982136 1.6005243-1.6005243 4.1966893-1.6005243 5.7972745.000061l5.8006469 5.801647c1.6019139 1.600591 1.6019139 4.1972066.0002922 5.7975056-1.6005243 1.6005243-4.1966893 1.6005243-5.7972136 0z"
                                  fillRule="nonzero"
                                />
                                <path
                                  d="M44.2767682 49.0854427c-.0796855.1431637-.1409432.2915959-.1839798.4449137-.2066214.7360886-1.129285.9774606-1.6698952.4368504l-3.071-3.071c-.4227588-.4227589-.3825419-1.1195578.0860482-1.4908709.7296849-.5782061 1.3890884-1.2376096 1.9672945-1.9672945.3713131-.4685901 1.068112-.508807 1.4908709-.0860482l3.071 3.071c.5409662.5409663.298863 1.4642816-.4379449 1.6702017-.1524408.0426036-.299632.1034181-.4698447.1976596-.0184888.0094983-.0184888.0094983-.0310432.015818-.1740347.1024444-.3053389.2007059-.4131672.3085343-.1052752.1052752-.2029509.2352593-.2975553.3920191-.0189673.0378655-.0189673.0378655-.0407833.0782168zm.7492923-.7780213c-.0150164.0082337-.0150277.0082399-.0041919.0024769a3.21566785 3.21566785 0 0 1 .0041919-.0024769zm-3.4977824-2.0632569l1.3399831 1.3399832c.1030122-.1362829.2127271-.2632496.332632-.3831545.1205479-.1205479.2483304-.2309889.3829023-.3328841l-1.339731-1.3397311c-.2299487.2471101-.4686764.4858378-.7157864.7157865zm.9945169 1.8804997l.0060477-.0112071a4.15519983 4.15519983 0 0 0-.004591.0082705l-.0014567.0029366z"
                                  fillRule="nonzero"
                                />
                                <path
                                  d="M2 54.0002h39c.5522847 0 1 .4477153 1 1s-.4477153 1-1 1H1c-.55228475 0-1-.4477153-1-1v-54c0-.55228475.44771525-1 1-1h34c.2652165 0 .5195704.10535684.7071068.29289322l8 8C43.8946432 8.4806296 44 8.73498351 44 9.0002v14.094c0 .5522847-.4477153 1-1 1s-1-.4477153-1-1V9.41441356L34.5857864 2.0002H2v52z"
                                  fillRule="nonzero"
                                />
                                <path
                                  d="M44 36.0005c0-6.6277153-5.3722847-12-12-12s-12 5.3722847-12 12 5.3722847 12 12 12 12-5.3722847 12-12zm2 0c0 7.7322847-6.2677153 14-14 14s-14-6.2677153-14-14 6.2677153-14 14-14 14 6.2677153 14 14zM50.4161068 57.3851932c.8194757.8194757 2.1493107.8194757 2.9690786-.000292.8200861-.819409.8200861-2.1487934-.0003531-2.9685554l-5.8009391-5.801939c-.8194757-.8194757-2.1493107-.8194757-2.9687864 0-.8204757.8204757-.8204757 2.1493107 0 2.9697864l5.801 5.801zm-1.4142136 1.4142136l-5.801-5.801c-1.6015243-1.6015243-1.6015243-4.1966893 0-5.7982136 1.6005243-1.6005243 4.1966893-1.6005243 5.7972745.000061l5.8006469 5.801647c1.6019139 1.600591 1.6019139 4.1972066.0002922 5.7975056-1.6005243 1.6005243-4.1966893 1.6005243-5.7972136 0z"
                                  fillRule="nonzero"
                                />
                                <path
                                  d="M40 36.0005c0-4.4184153-3.5815847-8-8-8-4.4184153 0-8 3.5815847-8 8 0 4.4184153 3.5815847 8 8 8 4.4184153 0 8-3.5815847 8-8zm2 0c0 5.5229847-4.4770153 10-10 10s-10-4.4770153-10-10 4.4770153-10 10-10 10 4.4770153 10 10z"
                                  fillRule="nonzero"
                                />
                                <path d="M33.41421356 36l1.41421356 1.41421356c.39052426.39052426.39052426 1.0236893 0 1.41421356-.39052425.39052426-1.0236893.39052426-1.41421356 0L32 37.41421356l-1.41421356 1.41421356c-.39052426.39052426-1.0236893.39052426-1.41421356 0-.39052426-.39052425-.39052426-1.0236893 0-1.41421356L30.58578644 36l-1.41421356-1.41421356c-.39052426-.39052426-.39052426-1.0236893 0-1.41421356.39052425-.39052426 1.0236893-.39052426 1.41421356 0L32 34.58578644l1.41421356-1.41421356c.39052426-.39052426 1.0236893-.39052426 1.41421356 0 .39052426.39052425.39052426 1.0236893 0 1.41421356L33.41421356 36z" />
                              </g>
                            </svg>
                            <div className="my-3 mt-6 text-2xl font-semibold">
                              Không có dữ liệu
                            </div>
                            <div className="max-w-[400px] text-center font-light">
                              Hãy thử sử dụng các tùy chọn bộ lọc khác nhau để
                              tìm thấy những gì bạn đang tìm kiếm
                            </div>
                          </div>
                        )}
                      </div>
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
});

export default PickerViewStock;
