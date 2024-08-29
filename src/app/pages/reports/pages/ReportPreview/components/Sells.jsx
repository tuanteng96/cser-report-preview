import {
  BanknotesIcon,
  ShoppingCartIcon,
  Square3Stack3DIcon,
} from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import moment from "moment";
import React, { useEffect, useRef, useState } from "react";
import ReportsAPI from "src/app/_ezs/api/reports.api";
import { formatArray } from "src/app/_ezs/utils/formatArray";
import { formatString } from "src/app/_ezs/utils/formatString";
import Chart from "react-apexcharts";
import { useRoles } from "src/app/_ezs/hooks/useRoles";
import { PickerViews } from ".";

function arrayTime() {
  let fromTime = moment("00:00:00", "HH:mm:ss");
  let toTime = moment("23:59:00", "HH:mm:ss");

  let duration = moment.duration(toTime.diff(fromTime));
  let diff = duration.hours();
  let array = [];

  for (let i = 0; diff > i; i = i + 2) {
    let From = moment(fromTime).add(i, "hours").format("HH:mm:ss");
    let To = moment(From, "HH:mm:ss")
      .add(2, "hours")
      .subtract(1, "seconds")
      .format("HH:mm:ss");

    array.push({
      From,
      To,
      Items: [],
    });
  }
  return array;
}

function Sells({ filters }) {
  const { report, bao_cao_ngay_tong_quan } = useRoles([
    "bao_cao_ngay_tong_quan",
    "report",
  ]);
  const [options, setOptions] = useState({
    series: [],
    options: {
      chart: {
        type: "bar",
        stacked: true,
        zoom: {
          enabled: true,
        },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          borderRadius: 10,
          borderRadiusApplication: "end", // 'around', 'end'
          borderRadiusWhenStacked: "last", // 'all', 'last'
          dataLabels: {
            total: {
              enabled: true,
              style: {
                fontSize: "12px",
                fontWeight: 600,
              },
            },
          },
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        show: true,
        width: 2,
        colors: ["transparent"],
      },
      xaxis: {
        categories: [],
      },
      colors: ["#2E93fA", "#66DA26", "#546E7A", "#E91E63", "#FF9800"],
      yaxis: {
        // title: {
        //   text: "$ (thousands)",
        // },
      },
      fill: {
        opacity: 1,
      },
      tooltip: {
        y: {
          formatter: function (val) {
            return "" + val + " đơn hàng";
          },
        },
      },
      legend: {
        show: false,
      },
    },
  });

  const [height, setHeight] = useState();

  const elRef = useRef();

  const { isLoading, data } = useQuery({
    queryKey: ["ReportsSells", filters],
    queryFn: async () => {
      let newFilters = {
        ...filters,
        Type: "ban-hang",
        DateStart: filters?.CrDate
          ? moment(filters?.CrDate).format("DD/MM/YYYY")
          : null,
        DateEnd: filters?.CrDate
          ? moment(filters?.CrDate).format("DD/MM/YYYY")
          : null,
        StockID:
          filters?.StockID && filters?.StockID.length > 0
            ? filters?.StockID
            : Stocks.map((x) => x.ID),
      };

      let { data } = await ReportsAPI.sells(newFilters);

      let newResult = {
        data: null,
        totalGroups: [],
      };

      if (data?.result?.Items) {
        let newItems = data.result.Items.reverse();
        newResult.data = newItems.map((item) => ({
          ...item,
          Groups: item.Groups
            ? item.Groups.map((group) => ({
                ...group,
                Title: group.GroupTitle,
                Keys: group.Keys
                  ? group.Keys.map((key) => ({
                      ...key,
                      Title: key.Key,
                      Value: {
                        Count: formatArray.sumTotal(key.Values, "Count"),
                        Qty: formatArray.sumTotal(key.Values, "Qty"),
                        Value: formatArray.sumTotal(key.Values, "Value"),
                      },
                    }))
                  : [],
              }))
            : [],
        }));

        for (let group of newResult.data[0].Groups) {
          let newObj = {
            ...group,
            Keys: [],
          };

          newObj.GroupCount = formatArray.sumTotalNested({
            Items: newResult.data,
            name: "GroupCount",
            key: group.GroupTitle,
          });
          newObj.GroupQty = formatArray.sumTotalNested({
            Items: newResult.data,
            name: "GroupQty",
            key: group.GroupTitle,
          });
          newObj.GroupValue = formatArray.sumTotalNested({
            Items: newResult.data,
            name: "GroupValue",
            key: group.GroupTitle,
          });

          for (let key of group.Keys) {
            newObj.Keys.push({
              ...key,
              Value: {
                Count: formatArray.sumTotalNested({
                  Items: newResult.data,
                  name: "Count",
                  key: key.Key,
                }),
                Qty: formatArray.sumTotalNested({
                  Items: newResult.data,
                  name: "Qty",
                  key: key.Key,
                }),
                Value: formatArray.sumTotalNested({
                  Items: newResult.data,
                  name: "Value",
                  key: key.Key,
                }),
              },
            });
          }

          newResult.totalGroups.push(newObj);
        }
      }

      return newResult;
    },
  });

  const { isLoading: isLoadingChart, data: dataChart } = useQuery({
    queryKey: ["ReportsSellsChart", filters],
    queryFn: async () => {
      let Stocks = bao_cao_ngay_tong_quan?.hasRight
        ? bao_cao_ngay_tong_quan?.StockRoles
        : report.StockRoles;

      let newFilters = {
        ...filters,
        Type: "ban-hang",
        DateStart: filters?.CrDate
          ? moment(filters?.CrDate).format("DD/MM/YYYY")
          : null,
        DateEnd: filters?.CrDate
          ? moment(filters?.CrDate).format("DD/MM/YYYY")
          : null,
        StockID:
          filters?.StockID && filters?.StockID.length > 0
            ? filters?.StockID
            : Stocks.map((x) => x.ID),
        GroupTitle: "Đơn hàng mới",
      };

      let { data } = await ReportsAPI.orders(newFilters);
      let arrayTimeList = arrayTime();

      if (
        data?.result?.List &&
        data.result.List.length > 0 &&
        data.result.List[0] &&
        data.result.List[0].length > 0
      ) {
        for (let item of data?.result?.List[0]) {
          let index = arrayTimeList.findIndex(
            (x) =>
              moment(
                moment(item.CreateDate).format("HH:mm:ss"),
                "HH:mm:ss"
              ).isSameOrAfter(moment(x.From, "HH:mm:ss")) &&
              moment(
                moment(item.CreateDate).format("HH:mm:ss"),
                "HH:mm:ss"
              ).isSameOrBefore(moment(x.To, "HH:mm:ss"))
          );
          if (index > -1) {
            arrayTimeList[index].Items.push(item);
          }
        }
      }

      let result = {
        categories: [],
        series: [],
        seriesDs: [],
      };

      result.categories = arrayTimeList.map(
        (x) =>
          `${moment(x.From, "HH:mm:ss").format("HH:mm")} - ${moment(
            x.To,
            "HH:mm:ss"
          ).format("HH:mm")}`
      );
      result.series.push({
        name: "Tổng",
        data: arrayTimeList.map((x) => x.Items.length),
      });
      result.seriesDs.push({
        name: "Tổng doanh số",
        data: arrayTimeList.map((x) => formatArray.sumTotal(x.Items, "ToPay")),
      });
      return result;
    },
  });

  useEffect(() => {
    setHeight(elRef?.current?.clientHeight / 2 + "px");
  }, [elRef, data]);

  return (
    <>
      <div className="col-span-2 p-6 rounded shadow-xxl">
        <div className="mb-6 text-xl font-semibold">Bán hàng</div>

        <div ref={elRef}>
          {isLoading && (
            <>
              <div className="pb-4 mb-4 border-b last:pb-0 last:mb-0 last:border-0">
                <div className="flex justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-[#ecf2ff] flex items-center justify-center rounded text-primary"></div>
                    <div className="pl-3 text-[#2a3547]">
                      <div className="font-semibold">
                        <div className="w-[200px] h-3 mb-1.5 bg-gray-200 rounded-full"></div>
                      </div>
                      <div className="text-sm font-light">
                        <div className="w-[100px] h-3 bg-gray-200 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  <div className="min-w-10 h-10 bg-[#ecf2ff] flex items-center justify-center rounded text-primary font-medium text-base animate-pulse"></div>
                </div>
                <div>
                  <div className="flex justify-between text-[15px] leading-6 border-b border-dashed pb-2 mb-2 last:border-0 last:pb-0 last:mb-0">
                    <div className="flex items-center">
                      <div className="w-2.5 h-2.5 rounded-sm bg-gray-300 animate-pulse"></div>
                      <div className="pl-2 font-light">
                        <div className="w-[150px] h-3 bg-gray-200 rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex justify-end font-semibold text-center min-w-10">
                      <div className="w-6 h-5 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex justify-between text-[15px] leading-6 border-b border-dashed pb-2 mb-2 last:border-0 last:pb-0 last:mb-0">
                    <div className="flex items-center">
                      <div className="w-2.5 h-2.5 rounded-sm bg-gray-300 animate-pulse"></div>
                      <div className="pl-2 font-light">
                        <div className="w-[150px] h-3 bg-gray-200 rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex justify-end font-semibold text-center min-w-10">
                      <div className="w-6 h-5 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="pb-4 mb-4 border-b last:pb-0 last:mb-0 last:border-0">
                <div className="flex justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-[#EEE5FF] flex items-center justify-center rounded text-info"></div>
                    <div className="pl-3 text-[#2a3547]">
                      <div className="font-semibold">
                        <div className="w-[200px] h-3 mb-1.5 bg-gray-200 rounded-full"></div>
                      </div>
                      <div className="text-sm font-light">
                        <div className="w-[100px] h-3 bg-gray-200 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  <div className="min-w-10 h-10 bg-[#EEE5FF] flex items-center justify-center rounded text-info font-medium text-base animate-pulse"></div>
                </div>
                <div>
                  <div className="flex justify-between text-[15px] leading-6 border-b border-dashed pb-2 mb-2 last:border-0 last:pb-0 last:mb-0">
                    <div className="flex items-center">
                      <div className="w-2.5 h-2.5 rounded-sm bg-gray-300 animate-pulse"></div>
                      <div className="pl-2 font-light">
                        <div className="w-[150px] h-3 bg-gray-200 rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex justify-end font-semibold text-center min-w-10">
                      <div className="w-6 h-5 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex justify-between text-[15px] leading-6 border-b border-dashed pb-2 mb-2 last:border-0 last:pb-0 last:mb-0">
                    <div className="flex items-center">
                      <div className="w-2.5 h-2.5 rounded-sm bg-gray-300 animate-pulse"></div>
                      <div className="pl-2 font-light">
                        <div className="w-[150px] h-3 bg-gray-200 rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex justify-end font-semibold text-center min-w-10">
                      <div className="w-6 h-5 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="pb-4 mb-4 border-b last:pb-0 last:mb-0 last:border-0">
                <div className="flex justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-[#F3F6F9] flex items-center justify-center rounded text-success"></div>
                    <div className="pl-3 text-[#2a3547]">
                      <div className="font-semibold">
                        <div className="w-[200px] h-3 mb-1.5 bg-gray-200 rounded-full"></div>
                      </div>
                      <div className="text-sm font-light">
                        <div className="w-[100px] h-3 bg-gray-200 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  <div className="min-w-10 h-10 bg-[#F3F6F9] flex items-center justify-center rounded text-success font-medium text-base animate-pulse"></div>
                </div>
                <div>
                  <div className="flex justify-between text-[15px] leading-6 border-b border-dashed pb-2 mb-2 last:border-0 last:pb-0 last:mb-0">
                    <div className="flex items-center">
                      <div className="w-2.5 h-2.5 rounded-sm bg-gray-300 animate-pulse"></div>
                      <div className="pl-2 font-light">
                        <div className="w-[150px] h-3 bg-gray-200 rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex justify-end font-semibold text-center min-w-10">
                      <div className="w-6 h-5 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex justify-between text-[15px] leading-6 border-b border-dashed pb-2 mb-2 last:border-0 last:pb-0 last:mb-0">
                    <div className="flex items-center">
                      <div className="w-2.5 h-2.5 rounded-sm bg-gray-300 animate-pulse"></div>
                      <div className="pl-2 font-light">
                        <div className="w-[150px] h-3 bg-gray-200 rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex justify-end font-semibold text-center min-w-10">
                      <div className="w-6 h-5 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex justify-between text-[15px] leading-6 border-b border-dashed pb-2 mb-2 last:border-0 last:pb-0 last:mb-0">
                    <div className="flex items-center">
                      <div className="w-2.5 h-2.5 rounded-sm bg-gray-300 animate-pulse"></div>
                      <div className="pl-2 font-light">
                        <div className="w-[150px] h-3 bg-gray-200 rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex justify-end font-semibold text-center min-w-10">
                      <div className="w-6 h-5 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
          {!isLoading && (
            <>
              {data.totalGroups.map((item, index) => (
                <div
                  className="pb-4 mb-4 border-b last:pb-0 last:mb-0 last:border-0"
                  key={index}
                >
                  <PickerViews
                    group={item}
                    api={{
                      path: "/api/v3/r23/hang-ngay/danh-sach#ban-hang",
                      filter: {
                        ...filters,
                        GroupTitle: item.GroupTitle,
                        Type: "ban-hang",
                      },
                    }}
                  >
                    {({ open }) => (
                      <div
                        className="flex justify-between mb-6 cursor-pointer"
                        onClick={open}
                      >
                        <div className="flex items-center">
                          <div
                            className={clsx(
                              "w-10 h-10 flex items-center justify-center rounded",
                              index === 0 && "bg-[#ecf2ff] text-primary",
                              index === 1 && "bg-[#EEE5FF] text-info",
                              index === 2 && "bg-[#F3F6F9] text-success"
                            )}
                          >
                            {index === 0 && (
                              <ShoppingCartIcon className="w-6" />
                            )}
                            {index === 1 && (
                              <Square3Stack3DIcon className="w-6" />
                            )}
                            {index === 2 && <BanknotesIcon className="w-6" />}
                          </div>
                          <div className="pl-3 text-[#2a3547]">
                            <div className="font-semibold text-[15px] md:text-base">
                              {item.GroupTitle}
                            </div>
                            <div className="text-sm font-light">Tổng tiền</div>
                          </div>
                        </div>
                        <div
                          className={clsx(
                            "min-w-10 h-10 flex items-center justify-center rounded font-medium text-[15px] px-2",
                            index === 0 && "bg-[#ecf2ff] text-primary",
                            index === 1 && "bg-[#EEE5FF] text-info",
                            index === 2 && "bg-[#F3F6F9] text-success"
                          )}
                        >
                          +{formatString.formatVNDPositive(item.GroupValue)}
                        </div>
                      </div>
                    )}
                  </PickerViews>
                  <div>
                    {item.Keys.map((key, i) => (
                      <PickerViews
                        key={i}
                        group={item}
                        item={key}
                        api={{
                          path: "/api/v3/r23/hang-ngay/danh-sach#ban-hang",
                          filter: {
                            ...filters,
                            GroupTitle: item.GroupTitle,
                            Key: key.Key,
                            Type: "ban-hang",
                          },
                        }}
                      >
                        {({ open }) => (
                          <div
                            onClick={() =>
                              item.GroupTitle !== "Đơn hàng mới" && open()
                            }
                            className="cursor-pointer flex justify-between text-[15px] leading-6 border-b border-dashed pb-2 mb-2 last:border-0 last:pb-0 last:mb-0"
                          >
                            <div className="flex items-center">
                              <div className="w-2.5 h-2.5 rounded-sm bg-gray-300"></div>
                              <div className="pl-2 font-light">{key.Key}</div>
                            </div>
                            <div className="font-semibold text-center min-w-10 text-[14px]">
                              {formatString.formatVNDPositive(key.Value.Value)}
                            </div>
                          </div>
                        )}
                      </PickerViews>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
      <div className="flex flex-col col-span-4 p-6 rounded shadow-xxl">
        <div className="mb-6 text-xl font-semibold">Biểu đồ bán hàng</div>
        <div>
          <Chart
            options={{
              ...options.options,
              xaxis: {
                ...options.options.xaxis,
                categories: dataChart?.categories || [],
              },
            }}
            series={dataChart?.series || []}
            type="bar"
            height={height}
          />
          <Chart
            options={{
              ...options.options,
              xaxis: {
                ...options.options.xaxis,
                categories: dataChart?.categories || [],
              },
              yaxis: {
                ...options.options.yaxis,
                labels: {
                  formatter: function (value) {
                    return formatString.formatVND(value);
                  },
                },
              },
              tooltip: {
                y: {
                  formatter: function (val) {
                    return "" + formatString.formatVND(val) + "";
                  },
                },
              },
              plotOptions: {
                ...options.options.plotOptions,
                bar: {
                  ...options.options.plotOptions.bar,
                  dataLabels: {
                    ...options.options.plotOptions.bar.dataLabels,
                    total: {
                      ...options.options.plotOptions.bar.dataLabels.total,
                      formatter: function (val, opts) {
                        return formatString.formatVND(val);
                      },
                    },
                  },
                },
              },
            }}
            series={dataChart?.seriesDs || []}
            type="bar"
            height={height}
          />
        </div>
      </div>
    </>
  );
}

export default Sells;
