import React, {
  forwardRef,
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FloatingPortal } from "@floating-ui/react";
import { Dialog } from "@headlessui/react";
import {
  AdjustmentsVerticalIcon,
  ArrowUpIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { AnimatePresence, LayoutGroup, m } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useRoles } from "src/app/_ezs/hooks/useRoles";
import moment from "moment";
import ReactBaseTable from "src/app/_ezs/partials/table";
import { useWindowSize } from "src/app/_ezs/hooks/useWindowSize";
import { PickerFilterRating, PickerViewMobile, PickerViewsRatingList } from ".";
import { SpinnerComponent } from "src/app/_ezs/components/spinner";
import ReportsAPI from "src/app/_ezs/api/reports.api";
import { InputDatePicker } from "src/app/_ezs/partials/forms";
import { formatArray } from "src/app/_ezs/utils/formatArray";
import { Controller, useForm } from "react-hook-form";
import { Button } from "src/app/_ezs/partials/button";
import clsx from "clsx";
import { useAuth } from "src/app/_ezs/core/Auth";
import ReactApexChart from "react-apexcharts";
import ReactECharts from "echarts-for-react";
import { filter } from "lodash-es";

const ChartView = ({ data, filters }) => {
  const openRef = useRef(null);

  const series = [
    Number(data?.Total?.Total ?? 0),
    // 23,
    Number(data?.Total?.Value1 ?? 0),
    Number(data?.Total?.Value2 ?? 0),
    Number(data?.Total?.Value3 ?? 0),
  ];

  const labels = [
    "Dịch vụ thực hiện",
    // "Khách hàng phục vụ",
    "Số lượt Mặt vui",
    "Số lượt góp ý (Mặt vừa)",
    "Số lượt chặn (Mặt buồn)",
  ];

  let colors = ["#3699FF", "#1BC5BD", "#FFA800", "#F64E60"];

  return (
    <PickerViewsRatingList keyID="Value">
      {({ open }) => {
        openRef.current = open;

        return (
          <div className="w-full chart-rating">
            <ReactApexChart
              options={{
                chart: {
                  type: "pie",
                  events: {
                    dataPointSelection: function (event, chartContext, config) {
                      const index = config.dataPointIndex;
                      const value = config.w.globals.series[index];
                      const label = config.w.globals.labels[index];

                      openRef.current({ index, label, value, filters });
                    },
                  },
                  animations: {
                    enabled: true,

                    easing: "easeinout", // mượt
                    speed: 800, // thời gian mount

                    animateGradually: {
                      enabled: true,
                      delay: 120, // từng slice xuất hiện
                    },

                    dynamicAnimation: {
                      enabled: true,
                      speed: 600, // khi data thay đổi
                    },
                  },
                },
                colors,
                labels,
                legend: {
                  show: true,
                  position: "right",
                  horizontalAlign: "center",
                },
                dataLabels: {
                  enabled: true,
                  formatter: function (val, opts) {
                    // opts.w.globals.series[opts.seriesIndex] là giá trị thực
                    return opts.w.globals.series[opts.seriesIndex];
                  },
                },
                responsive: [
                  {
                    breakpoint: 768, // mobile & tablet
                    options: {
                      legend: {
                        position: "bottom",
                        horizontalAlign: "center",
                      },
                    },
                  },
                ],
              }}
              series={series}
              type="pie"
            />
          </div>
        );
      }}
    </PickerViewsRatingList>
  );
};

const ChartTotalCases = ({
  total,
  pending,
  done,
  ktvError,
  otherError,
  filters,
}) => {
  const openRef = useRef(null);

  const series = [pending, done, ktvError, otherError];

  const labels = [
    "Ca chưa xử lý",
    "Ca đã xử lý",
    "Ca lỗi KTV (Bị trừ công)",
    "Ca lỗi khách quan",
  ];

  const colors = [
    "#FFA800",
    "#50CD89", // xanh - done
    "#F1416C", // đỏ - lỗi ktv
    "#8950FC", // cam - lỗi khác
  ];

  return (
    <PickerViewsRatingList keyID="FeedBackStatus">
      {({ open }) => {
        openRef.current = open;

        return (
          <div className="w-full chart-rating">
            <ReactApexChart
              options={{
                chart: {
                  type: "donut",
                  events: {
                    dataPointSelection: function (event, chartContext, config) {
                      const index = config.dataPointIndex;
                      const value = config.w.globals.series[index];
                      const label = config.w.globals.labels[index];

                      //openRef.current({ index, label, value, filters });
                    },
                  },
                },
                labels,
                colors,
                plotOptions: {
                  pie: {
                    donut: {
                      size: "72%",
                      labels: {
                        show: true,
                        total: {
                          show: true,
                          label: "Tổng số ca",
                          fontSize: "14px",
                          color: "#7E8299",
                          formatter: () => total,
                        },
                        value: {
                          show: true,
                          fontSize: "28px",
                          fontWeight: 700,
                          color: "#181C32",
                        },
                      },
                    },
                  },
                },
                dataLabels: {
                  enabled: true,
                  formatter: function (val, opts) {
                    // giá trị thực (số ca)
                    return opts.w.globals.series[opts.seriesIndex];
                  },
                  style: {
                    fontSize: "13px",
                    fontWeight: 600,
                    colors: ["#ffffff"], // chữ trắng trên slice
                  },
                  dropShadow: {
                    enabled: false,
                  },
                },
                legend: {
                  show: true,
                  position: "right",
                  fontSize: "13px",
                  markers: {
                    width: 10,
                    height: 10,
                    radius: 10,
                  },
                },
                tooltip: {
                  y: {
                    formatter: (val) => `${val} ca`,
                  },
                },
                responsive: [
                  {
                    breakpoint: 768, // mobile & tablet
                    options: {
                      legend: {
                        position: "bottom",
                        horizontalAlign: "center",
                      },
                    },
                  },
                ],
              }}
              series={series}
              type="donut"
            />
          </div>
        );
      }}
    </PickerViewsRatingList>
  );
};

const NestedChartView = ({
  total = 0,
  pending = 0,
  ktvError = 0,
  otherError = 0,
  filters,
}) => {
  const openRef = useRef(null);

  const totalError = ktvError + otherError + pending;
  const remain = Math.max(total - pending - totalError, 0);
  const pieCenter = ["50%", "42%"];

  const option = {
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c} ca",
    },

    legend: {
      show: true,
      orient: "horizontal",
      bottom: 0, // 👈 xuống đáy
      left: "center", // 👈 căn giữa
      itemWidth: 12,
      itemHeight: 12,
      itemGap: 20,
      textStyle: {
        fontSize: 13,
        color: "#3F4254",
      },
      selectedMode: false,
    },

    grid: {
      bottom: 70, // = legend height + padding
    },

    series: [
      /* ================= VÒNG NGOÀI ================= */
      {
        name: "Chi tiết",
        type: "pie",
        radius: ["62%", "80%"],
        center: pieCenter,
        startAngle: 90,
        clockwise: true,
        label: {
          show: true,
          formatter: "{c}",
          fontSize: 12,
          fontWeight: 600,
        },
        data: [
          {
            value: pending,
            name: "Số mặt vui",
            itemStyle: { color: "#4CAF50" },
          },
          {
            value: ktvError,
            name: "Số lượt góp ý (Mặt vừa)",
            itemStyle: { color: "#FFA800" },
          },
          {
            value: otherError,
            name: "Số lượt chặn (Mặt buồn)",
            itemStyle: { color: "#F1416C" },
          },
        ],
      },

      /* ========== VÒNG GIỮA – NỀN XÁM FULL ========== */
      {
        name: "Nền",
        type: "pie",
        radius: ["42%", "60%"],
        center: pieCenter,
        startAngle: 90,
        silent: true,
        label: { show: false },
        data: [
          {
            value: total,
            itemStyle: {
              color: "#E4E6EF", // xám nhạt nền
            },
          },
        ],
      },

      {
        name: "Tổng ca lỗi",
        type: "pie",
        radius: ["42%", "60%"],
        startAngle: 90,
        clockwise: true,
        center: pieCenter,

        // 👇 tắt label mặc định cho cả series
        label: { show: false },

        data: [
          {
            value: totalError,
            name: "Dịch vụ thực hiện",
            itemStyle: { color: "#3699ff" },

            // 👇 bật label chỉ cho lát này
            label: {
              show: totalError > 0,
              position: "inside",
              formatter: "{c}",
              fontSize: 14,
              fontWeight: 700,
              color: "#FFFFFF",
            },
          },
          {
            value: remain,
            itemStyle: { color: "transparent" },
            tooltip: { show: false },
          },
        ],
      },
    ],

    /* ================= TEXT TRUNG TÂM ================= */
    graphic: [
      {
        type: "text",
        left: "center",
        top: "35%",
        style: {
          text: "DỊCH VỤ THỰC HIỆN",
          fill: "#7E8299",
          fontSize: 13,
        },
      },
      {
        type: "text",
        left: "center",
        top: "42%",
        style: {
          text: total,
          fill: "#181C32",
          fontSize: 30,
          fontWeight: 700,
        },
      },
    ],
  };
  return (
    <PickerViewsRatingList keyID="Value">
      {({ open }) => {
        openRef.current = open;
        return (
          <ReactECharts
            option={option}
            style={{ height: 400, width: "100%" }}
            onEvents={{
              click: (params) => {
                // chỉ nhận click vào pie slice
                if (
                  params?.componentType !== "series" ||
                  params?.seriesType !== "pie"
                )
                  return;

                let index = params.dataIndex;

                if (params.name === "Số mặt vui") {
                  index = 1;
                }

                if (params.name === "Số lượt góp ý (Mặt vừa)") {
                  index = 2;
                }

                if (params.name === "Số lượt chặn (Mặt buồn)") {
                  index = 3;
                }

                open?.({
                  index,
                  label: params.name,
                  filters,
                });
              },
            }}
          />
        );
      }}
    </PickerViewsRatingList>
  );
};

const NestedDonutChart = ({
  total = 0,
  pending = 0,
  ktvError = 0,
  otherError = 0,
  onClick,
}) => {
  const totalError = ktvError + otherError;
  const remain = Math.max(total - pending - totalError, 0);
  const pieCenter = ["50%", "42%"];

  const option = {
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c} ca",
    },

    legend: {
      show: true,
      orient: "horizontal",
      bottom: 0, // 👈 xuống đáy
      left: "center", // 👈 căn giữa
      itemWidth: 12,
      itemHeight: 12,
      itemGap: 20,
      textStyle: {
        fontSize: 13,
        color: "#3F4254",
      },
      selectedMode: false,
    },

    grid: {
      bottom: 70, // = legend height + padding
    },

    series: [
      /* ================= VÒNG NGOÀI ================= */
      {
        name: "Chi tiết",
        type: "pie",
        radius: ["62%", "80%"],
        center: pieCenter,
        startAngle: 90,
        clockwise: true,
        label: {
          show: true,
          formatter: "{c}",
          fontSize: 12,
          fontWeight: 600,
        },
        data: [
          {
            value: pending,
            name: "Ca chưa xử lý",
            itemStyle: { color: "#FFA800" },
          },
          {
            value: ktvError,
            name: "Ca lỗi KTV",
            itemStyle: { color: "#F1416C" },
          },
          {
            value: otherError,
            name: "Ca lỗi khách quan",
            itemStyle: { color: "#8950FC" },
          },
        ],
      },

      /* ========== VÒNG GIỮA – NỀN XÁM FULL ========== */
      {
        name: "Nền",
        type: "pie",
        radius: ["42%", "60%"],
        center: pieCenter,
        startAngle: 90,
        silent: true,
        label: { show: false },
        data: [
          {
            value: total,
            itemStyle: {
              color: "#E4E6EF", // xám nhạt nền
            },
          },
        ],
      },

      {
        name: "Tổng ca lỗi",
        type: "pie",
        radius: ["42%", "60%"],
        startAngle: 90,
        clockwise: true,
        center: pieCenter,

        // 👇 tắt label mặc định cho cả series
        label: { show: false },

        data: [
          {
            value: pending,
            itemStyle: { color: "transparent" },
            tooltip: { show: false },
          },
          {
            value: totalError,
            name: "Đã xử lý",
            itemStyle: { color: "#4CAF50" },

            // 👇 bật label chỉ cho lát này
            label: {
              show: totalError > 0,
              position: "inside",
              formatter: "{c}",
              fontSize: 14,
              fontWeight: 700,
              color: "#FFFFFF",
            },
          },
          {
            value: remain,
            itemStyle: { color: "transparent" },
            tooltip: { show: false },
          },
        ],
      },
    ],

    /* ================= TEXT TRUNG TÂM ================= */
    graphic: [
      {
        type: "text",
        left: "center",
        top: "35%",
        style: {
          text: "TỔNG SỐ CA",
          fill: "#7E8299",
          fontSize: 13,
        },
      },
      {
        type: "text",
        left: "center",
        top: "42%",
        style: {
          text: total,
          fill: "#181C32",
          fontSize: 30,
          fontWeight: 700,
        },
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: 400, width: "100%" }}
      onEvents={{
        click: (params) => {
          // chỉ nhận click vào pie slice
          if (
            params?.componentType !== "series" ||
            params?.seriesType !== "pie"
          )
            return;

          // onClick?.(params);
          // console.log("CLICK:", params.name, params.value);
        },
      }}
    />
  );
};

const PickerViewRating = forwardRef((props, ref) => {
  let { children, onClose, ...rest } = props;

  let { CrStocks } = useAuth();

  let [visible, setVisible] = useState(false);
  let [Lists, setLists] = useState([]);

  const [filters, setFilters] = useState({
    Pi: 1,
    Ps: 20,
    DateStart: new Date(), //moment().subtract(1, "days").toDate()
    DateEnd: new Date(),
    StockID: CrStocks,
    // filter: {
    //   CreateDate: [],
    //   StockID: CrStocks?.ID,
    //   Value: 0,
    //   Status: "",
    //   FeedBackStatus: "",
    //   "OSJSON.$.ServiceID": 0,
    //   MemberID: 0,
    //   UserID: 0,
    // },
    // ignoreFilter: {
    //   StockID: 0,
    //   Value: 0,
    //   Status: "",
    //   FeedBackStatus: "",
    //   "OSJSON.$.ServiceID": 0,
    //   MemberID: 0,
    //   UserID: 0,
    // },
  });
  let [sortState, setSortState] = useState({
    Total: "asc",
    Value1: "asc",
    Value2: "asc",
    Value3: "asc",
    RatioBlock: "asc",
  });
  const { report, bao_cao_ngay_tong_quan } = useRoles([
    "bao_cao_ngay_tong_quan",
    "report",
  ]);

  const { width } = useWindowSize();

  const { control, handleSubmit } = useForm({
    defaultValues: {
      DateStart: filters.DateStart,
      DateEnd: filters.DateEnd,
    },
  });

  const { isLoading, data } = useQuery({
    queryKey: ["ViewRating", { ...filters }],
    queryFn: async () => {
      let newFilters = {
        feedback: 1,
        StockID: filters.StockID?.value || "",
        DateStart: moment(filters.DateStart).format("DD/MM/YYYY"),
        DateEnd: moment(filters.DateEnd).format("DD/MM/YYYY"),
        Pi: 1,
        Ps: 15,
        MemberID: 0,
        StaffID: 0,
        Status: "",
        StatusFeedBack: "",
        Value: 0,
      };
      let { data } = await ReportsAPI.viewRatingOverview(newFilters);

      return data?.result;
    },
    enabled: visible,
  });

  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
      }, 100);
    }
  }, [visible]);

  useEffect(() => {
    setLists(
      data?.TotalUsers
        ? data?.TotalUsers.map((rowData) => ({
            ...rowData,
            RatioBlock: Math.round((rowData?.Value3 / rowData?.Total) * 100),
          }))
        : []
    );
  }, [data]);

  const columns = useMemo(
    () => {
      return [
        {
          key: "STT",
          title: "STT",
          dataKey: "STT",
          width: 70,
          cellRenderer: ({ rowIndex }) => rowIndex + 1,
          sortable: false,
        },
        {
          key: "UserID",
          title: "ID nhân viên",
          dataKey: "UserID",
          width: 130,
          sortable: false,
        },
        {
          key: "UserJSON",
          title: "Tên nhân viên",
          dataKey: "UserJSON",
          cellRenderer: ({ rowData }) => {
            let User = rowData?.UserJSON ? JSON.parse(rowData?.UserJSON) : null;
            return User?.FullName;
          },
          width: 250,
          sortable: false,
        },
        {
          key: "Total",
          title: "Tổng số ca làm",
          dataKey: "Total",
          cellRenderer: ({ rowData }) => rowData?.Total,
          width: 200,
          sortable: true,
        },
        {
          key: "Value1",
          title: "Số lượng Mặt Vui",
          dataKey: "Value1",
          cellRenderer: ({ rowData }) => rowData?.Value1,
          width: 200,
          sortable: true,
        },
        {
          key: "Value2",
          title: "Số lượng Mặt Vừa",
          dataKey: "Value2",
          cellRenderer: ({ rowData }) => rowData?.Value2,
          width: 200,
          sortable: true,
        },
        {
          key: "Value3",
          title: "Số lượng Mặt Buồn (Bị Block)",
          dataKey: "Value3",
          cellRenderer: ({ rowData }) => rowData?.Value3,
          width: 300,
          sortable: true,
        },
        {
          key: "RatioBlock",
          title: "Tỷ lệ Block",
          dataKey: "RatioBlock",
          cellRenderer: ({ rowData }) => rowData?.RatioBlock + "%",
          width: 300,
          sortable: true,
        },
      ];
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
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
                          Báo cáo đánh giá dịch vụ
                        </div>
                        <form
                          onSubmit={handleSubmit(onSubmit)}
                          className="flex items-center"
                          autoComplete="off"
                        >
                          <div className="flex gap-3">
                            <PickerFilterRating
                              filters={filters}
                              onSubmits={(values) => {
                                setFilters((prevState) => ({
                                  ...prevState,
                                  ...values,
                                }));
                              }}
                            >
                              {({ open }) => (
                                <div
                                  className="flex items-center justify-center bg-[#6d757d] rounded w-11 h-11 text-white"
                                  onClick={open}
                                >
                                  <AdjustmentsVerticalIcon className="w-6" />
                                </div>
                              )}
                            </PickerFilterRating>
                            {/* <div className="w-[150px]">
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
                                      minDate={formatArray.getDateLimit({
                                        Auth: {
                                          Info,
                                        },
                                        Action: "minDate",
                                        Type: "THEO_NGAY",
                                      })}
                                      maxDate={formatArray.getDateLimit({
                                        Auth: {
                                          Info,
                                        },
                                        Action: "maxDate",
                                        Type: "THEO_NGAY",
                                      })}
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
                                      minDate={formatArray.getDateLimit({
                                        Auth: {
                                          Info,
                                        },
                                        Action: "minDate",
                                        Type: "THEO_NGAY",
                                      })}
                                      maxDate={formatArray.getDateLimit({
                                        Auth: {
                                          Info,
                                        },
                                        Action: "maxDate",
                                        Type: "THEO_NGAY",
                                      })}
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
                              </Button> */}
                          </div>
                          <div className="w-[1px] h-11 bg-gray-300 ml-4 mr-2"></div>
                          <div
                            className="flex items-center justify-center w-12 cursor-pointer h-11"
                            onClick={onHide}
                          >
                            <XMarkIcon className="w-6 md:w-8" />
                          </div>
                        </form>
                      </Dialog.Title>

                      <div className="p-5 overflow-auto grow">
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                          {/* <ChartView data={data} filters={filters} />

                          <ChartTotalCases
                            total={
                              (data?.Total?.FeedBackStatus["0"] || 0) +
                              (data?.Total?.FeedBackStatus["1"] || 0) +
                              (data?.Total?.FeedBackStatus["2"] || 0)
                            }
                            pending={data?.Total?.FeedBackStatus["0"] || 0}
                            done={
                              (data?.Total?.FeedBackStatus["1"] || 0) +
                              (data?.Total?.FeedBackStatus["2"] || 0)
                            }
                            ktvError={data?.Total?.FeedBackStatus["1"] || 0}
                            otherError={data?.Total?.FeedBackStatus["2"] || 0}
                            filters={filters}
                            key={JSON.stringify(data?.Total)}
                          /> */}
                          <NestedChartView
                            ktvError={data?.Total?.Value2 || 0}
                            otherError={data?.Total?.Value3 || 0}
                            total={
                              (data?.Total?.Value1 || 0) +
                              (data?.Total?.Value2 || 0) +
                              (data?.Total?.Value3 || 0)
                            }
                            pending={data?.Total?.Value1 || 0}
                            filters={filters}
                          />
                          <NestedDonutChart
                            ktvError={data?.Total?.FeedBackStatus["1"] || 0}
                            otherError={data?.Total?.FeedBackStatus["2"] || 0}
                            total={
                              (data?.Total?.FeedBackStatus["0"] || 0) +
                              (data?.Total?.FeedBackStatus["1"] || 0) +
                              (data?.Total?.FeedBackStatus["2"] || 0)
                            }
                            pending={data?.Total?.FeedBackStatus["0"] || 0}
                          />
                        </div>
                        <div className="mt-8">
                          <div className="mb-4 font-semibold uppercase lg:text-xl text-md">
                            Báo cáo Hiệu quả Nhân sự (KTV Performance)
                          </div>
                          <ReactBaseTable
                            fixed
                            wrapClassName="h-[500px]"
                            rowKey="UserID"
                            columns={columns}
                            data={Lists || []}
                            rowHeight={65}
                            isPreviousData={false}
                            loading={isLoading}
                            footerClass="flex items-center justify-between w-full px-5 pb-5"
                            sortState={sortState}
                            onColumnSort={onColumnSort}
                          />
                        </div>
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

export default PickerViewRating;
