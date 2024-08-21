import React, { useState } from "react";
import { useAuth } from "src/app/_ezs/core/Auth";
import {
  Customers,
  Incomes,
  Members,
  PickerFilterReport,
  Sells,
  Services,
} from "./components";
import { InputDatePicker } from "src/app/_ezs/partials/forms";
import { SelectStocks } from "src/app/_ezs/partials/select";
import moment from "moment";
import { AdjustmentsVerticalIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { useRoles } from "src/app/_ezs/hooks/useRoles";
import { useQueryClient } from "@tanstack/react-query";

function ReportPreview(props) {
  let { CrStocks } = useAuth();
  const queryClient = useQueryClient();

  const { report, bao_cao_ngay_tong_quan } = useRoles([
    "bao_cao_ngay_tong_quan",
    "report",
  ]);

  const [filters, setFilters] = useState({
    Type: "",
    StockID: CrStocks?.ID ? [CrStocks?.ID] : null,
    CrDate: moment().toDate()
    // DateStart: moment().clone().startOf("week").toDate(), //"30/07/2024"
    // DateEnd: moment().clone().endOf("week").toDate(), //"31/07/2024"
  });

  const onRefeching = () => {
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['ReportsCustomers'] }),
      queryClient.invalidateQueries({ queryKey: ['ReportsIncomes'] }),
      queryClient.invalidateQueries({ queryKey: ['ReportsSellsChart'] }),
      queryClient.invalidateQueries({ queryKey: ['ReportsServices'] }),
      queryClient.invalidateQueries({ queryKey: ['ReportsSells'] }),
      queryClient.invalidateQueries({ queryKey: ['ReportsMembers'] }),
    ]);
  };

  return (
    <div className="p-4 xl:p-6">
      <div className="flex items-center justify-between mb-4 lg:mb-6">
        <div className="text-xl font-semibold lg:text-2xl">
          Báo cáo tổng quan
        </div>
        <div className="hidden gap-2 lg:flex">
          <div className="w-[50px] h-[50px] flex items-center justify-center bg-[#ecf2ff] text-primary rounded cursor-pointer" onClick={onRefeching}>
            <ArrowPathIcon className="w-6" />
          </div>
          <div className="w-[150px]">
            <InputDatePicker
              //popperPlacement='top-start'
              placeholderText="Chọn ngày"
              autoComplete="off"
              onChange={(e) =>
                setFilters((prevState) => ({
                  ...prevState,
                  CrDate: e,
                }))
              }
              selected={filters.CrDate ? new Date(filters.CrDate) : null}
              dateFormat="dd/MM/yyyy"
            />
          </div>
          <SelectStocks
            isMulti
            isClearable={true}
            className="select-control w-[300px]"
            value={filters.StockID}
            onChange={(val) => {
              setFilters((prevState) => ({
                ...prevState,
                StockID: val ? val.map((x) => x.value) : [],
              }));
            }}
            StockRoles={
              bao_cao_ngay_tong_quan?.hasRight
                ? bao_cao_ngay_tong_quan?.StockRoles
                : report.StockRoles
            }
          />
        </div>
        <PickerFilterReport
          onSubmits={(values) => {
            setFilters(values);
          }}
        >
          {({ open }) => (
            <div
              className="flex lg:hidden items-center justify-center w-10 h-10 bg-[#F3F6F9] rounded"
              onClick={open}
            >
              <AdjustmentsVerticalIcon className="w-6" />
            </div>
          )}
        </PickerFilterReport>
      </div>
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-6 xl:gap-6">
        <Customers filters={filters} />
        <Sells filters={filters} />
        <Services filters={filters} />
        <Incomes filters={filters} />
        <Members filters={filters} />
      </div>
    </div>
  );
}

export default ReportPreview;
