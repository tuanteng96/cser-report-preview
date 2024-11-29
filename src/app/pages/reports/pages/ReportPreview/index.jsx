import React, { useState } from "react";
import { useAuth } from "src/app/_ezs/core/Auth";
import {
  Customers,
  Incomes,
  Members,
  PickerFilterReport,
  Player,
  Sells,
  Services,
} from "./components";
import { InputDatePicker } from "src/app/_ezs/partials/forms";
import { SelectStocks } from "src/app/_ezs/partials/select";
import moment from "moment";
import {
  AdjustmentsVerticalIcon,
  ArrowPathIcon,
  PlayIcon,
} from "@heroicons/react/24/outline";
import { useRoles } from "src/app/_ezs/hooks/useRoles";
import { useQueryClient } from "@tanstack/react-query";
import { ReportContext } from "src/app/_ezs/contexts";
import { formatString } from "src/app/_ezs/utils/formatString";
import axios from "axios";

function ReportPreview(props) {
  let { CrStocks } = useAuth();
  const queryClient = useQueryClient();

  const { report, bao_cao_ngay_tong_quan } = useRoles([
    "bao_cao_ngay_tong_quan",
    "report",
  ]);

  const [filters, setFilters] = useState({
    Type: "",
    StockID:
      report?.IsStocks || bao_cao_ngay_tong_quan?.IsStocks
        ? null
        : CrStocks?.ID
        ? [CrStocks?.ID]
        : null,
    CrDate: moment().toDate(),
    // DateStart: moment().clone().startOf("week").toDate(), //"30/07/2024"
    // DateEnd: moment().clone().endOf("week").toDate(), //"31/07/2024"
  });
  const [Store, setStore] = useState({
    Customers: [],
    Incomes: [],
    Sells: [],
    Services: [],
    Members: [],
  });

  const [currentMusic, setCurrentMusic] = useState({
    string: "",
    prevSrc: "",
    src: "",
  });

  const onRefeching = () => {
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["ReportsCustomers"] }),
      queryClient.invalidateQueries({ queryKey: ["ReportsIncomes"] }),
      queryClient.invalidateQueries({ queryKey: ["ReportsSellsChart"] }),
      queryClient.invalidateQueries({ queryKey: ["ReportsServices"] }),
      queryClient.invalidateQueries({ queryKey: ["ReportsSells"] }),
      queryClient.invalidateQueries({ queryKey: ["ReportsMembers"] }),
    ]);
  };

  const TextToSpeech = (s) => {
    let text =
      s ||
      "Xin chào, Khách mới tạo từ phần mềm hôm nay là [KHACH_TAO_TU_PHAN_MEM]. Đơn hàng mới [DON_HANG_MOI]";

    let ListsFind = text.match(/(?<=\[)[^\][]*(?=])/g);

    const rs = {};
    if (ListsFind) {
      for (let key of ListsFind) {
        Object.keys(Store).every((s) => {
          Store[s].every((group) => {
            if (group.KeyID === key) {
              rs[`[${key}]`] = group.GroupValue;
              return;
            }
            let index = group.Keys
              ? group.Keys.findIndex((x) => x.KeyID === key)
              : -1;
            if (index > -1) {
              rs[`[${key}]`] = group.Keys[index].Value?.Value;
              return;
            }

            return true;
          });
          return true;
        });
      }
    }

    text = formatString.replaceAll(text, rs);

    if (currentMusic.string && text === currentMusic.string) {
      setCurrentMusic((prevState) => ({
        ...prevState,
        src: prevState.prevSrc,
      }));
    } else {
      const urlencoded = new URLSearchParams();
      urlencoded.append("input", text);
      urlencoded.append("speaker_id", 1);
      urlencoded.append("speed", 1.0);

      axios
        .post("https://api.zalo.ai/v1/tts/synthesize", urlencoded, {
          headers: {
            apikey: "s8bQYXbQ09YiIM3lnbWUsPvtmM0BHqhd",
            "Content-Type": "application/x-www-form-urlencoded",
          },
        })
        .then(async ({ data }) => {
          setCurrentMusic({
            string: text,
            src: data.data.url,
            prevSrc: data.data.url,
          });
        });
    }
  };

  window.top.StringJSX = TextToSpeech;
  window.StringJSX = TextToSpeech;

  return (
    <ReportContext.Provider
      value={{ Store, setStore, currentMusic, setCurrentMusic }}
    >
      <div className="p-4 xl:p-6">
        <div className="flex items-center justify-between mb-4 lg:mb-6">
          <div className="text-xl font-semibold lg:text-2xl">
            Báo cáo tổng quan
          </div>
          <div className="hidden gap-2 lg:flex">
            <div
              className="w-[50px] h-[50px] flex items-center justify-center bg-[#C9F7F5] text-success rounded cursor-pointer"
              onClick={() => TextToSpeech()}
            >
              <PlayIcon className="w-6" />
            </div>
            <div
              className="w-[50px] h-[50px] flex items-center justify-center bg-[#ecf2ff] text-primary rounded cursor-pointer"
              onClick={onRefeching}
            >
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
          <div className="flex gap-2 lg:hidden">
            <div
              className="w-10 h-10 flex items-center justify-center bg-[#C9F7F5] text-success rounded cursor-pointer"
              onClick={() => TextToSpeech()}
            >
              <PlayIcon className="w-5" />
            </div>
            <PickerFilterReport
              onSubmits={(values) => {
                setFilters((prevState) => ({
                  ...prevState,
                  CrDate: values.CrDate,
                  StockID: values.StockID,
                }));
              }}
            >
              {({ open }) => (
                <div
                  className="flex items-center justify-center w-10 h-10 bg-[#F3F6F9] rounded"
                  onClick={open}
                >
                  <AdjustmentsVerticalIcon className="w-6" />
                </div>
              )}
            </PickerFilterReport>
          </div>
        </div>
        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-6 xl:gap-6">
          <Customers filters={filters} />
          <Sells filters={filters} />
          <Services filters={filters} />
          <Incomes filters={filters} />
          <Members filters={filters} />
        </div>
      </div>
      {currentMusic.src && <Player />}
    </ReportContext.Provider>
  );
}

export default ReportPreview;
