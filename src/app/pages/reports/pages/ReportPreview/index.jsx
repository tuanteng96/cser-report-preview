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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ReportContext } from "src/app/_ezs/contexts";
import { formatString } from "src/app/_ezs/utils/formatString";
import ConfigAPI from "src/app/_ezs/api/config.api";
import axios from "axios";
import clsx from "clsx";

function ReportPreview(props) {
  let { CrStocks, GlobalConfig } = useAuth();
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
    isLoadingCustomers: true,
    isLoadingIncomes: true,
    isLoadingSells: true,
    isLoadingServices: true,
    isLoadingMembers: true,
  });

  const [currentMusic, setCurrentMusic] = useState({
    string: "",
    prevSrc: "",
    src: "",
  });

  const textSpeechMutation = useMutation({
    mutationFn: async (body) => {
      let data = await ConfigAPI.urlAction(body);
      return data;
    },
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
    if (!GlobalConfig?.Admin?.TextToSpeech) return;
    let text =
      s ||
      "Xin chào, Khách mới tạo từ phần mềm hôm nay là [KHACH_TAO_TU_PHAN_MEM]. Đơn hàng mới [DON_HANG_MOI]";

    let ListsFind = Array.from(text.matchAll(/\[([^\][]*)]/g), (x) => x[1]);

    const rs = {};
    if (ListsFind) {
      for (let key of ListsFind) {
        Object.keys(Store).every((s) => {
          if (typeof Store[s] === "object") {
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
          }

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
      if (GlobalConfig?.Admin?.TextToSpeech.toUpperCase() === "GOOGLE") {
        textSpeechMutation.mutate(
          {
            url: "https://texttospeech.googleapis.com/v1/text:synthesize",
            headers: {},
            param: {
              key: "{KEY_API_TEXT_TO_SPEECH}",
            },
            method: "POST", //"GET",
            include: "ENV",
            body: {
              audioConfig: {
                audioEncoding: "LINEAR16",
                effectsProfileId: ["small-bluetooth-speaker-class-device"],
                pitch: 0,
                speakingRate: 1,
              },
              input: {
                text: text,
              },
              voice: {
                languageCode: "vi-VN",
                name: "vi-VN-Wavenet-D",
              },
            },
            resultType: "json",
          },
          {
            onSuccess: ({ data }) => {
              if (data?.result?.audioContent) {
                setCurrentMusic({
                  string: text,
                  src: "data:audio/mp3;base64," + data?.result?.audioContent,
                  prevSrc:
                    "data:audio/mp3;base64," + data?.result?.audioContent,
                });
              }
            },
          }
        );
      }
      if (GlobalConfig?.Admin?.TextToSpeech.toUpperCase() === "ZALO") {
        textSpeechMutation.mutate(
          {
            url: "https://api.zalo.ai/v1/tts/synthesize",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              apikey: "[KEY_API_TEXT_TO_SPEECH_ZALO]",
            },
            method: "POST", //"GET",
            include: "ENV",
            body: {
              speaker_id: "4",
              speed: "1",
              input: text,
            },
            resultType: "json",
          },
          {
            onSuccess: ({ data }) => {
              if (data?.result?.data?.url) {
                setCurrentMusic({
                  string: text,
                  src: data?.result?.data?.url + ".mp3",
                  prevSrc: data?.result?.data?.url + ".mp3",
                });
              }
            },
          }
        );
      }
    }
  };

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
            {GlobalConfig?.Admin?.TextToSpeech ? (
              <button
                disabled={
                  Store.isLoadingCustomers ||
                  Store.isLoadingIncomes ||
                  Store.isLoadingMembers ||
                  Store.isLoadingSells ||
                  Store.isLoadingServices ||
                  textSpeechMutation?.isPending
                }
                type="button"
                className={clsx(
                  "w-[50px] h-[50px] flex items-center justify-center bg-[#C9F7F5] text-success rounded cursor-pointer disabled:opacity-80 group",
                  Store.isLoadingCustomers ||
                    Store.isLoadingIncomes ||
                    Store.isLoadingMembers ||
                    Store.isLoadingSells ||
                    Store.isLoadingServices ||
                    textSpeechMutation?.isPending
                    ? "is-loading"
                    : "not-loading"
                )}
                onClick={() => TextToSpeech()}
              >
                <div className="group-[.is-loading]:block hidden" role="status">
                  <svg
                    aria-hidden="true"
                    className="w-6 text-gray-200 animate-spin dark:text-gray-600 fill-success"
                    viewBox="0 0 100 101"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                      fill="currentColor"
                    />
                    <path
                      d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                      fill="currentFill"
                    />
                  </svg>
                  <span className="sr-only">Loading...</span>
                </div>
                <PlayIcon className="w-6 group-[.not-loading]:block hidden" />
              </button>
            ) : (
              <></>
            )}

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
            {GlobalConfig?.Admin?.TextToSpeech && (
              <button
                disabled={
                  Store.isLoadingCustomers ||
                  Store.isLoadingIncomes ||
                  Store.isLoadingMembers ||
                  Store.isLoadingSells ||
                  Store.isLoadingServices ||
                  textSpeechMutation?.isPending
                }
                type="button"
                className={clsx(
                  "w-10 h-10 flex items-center justify-center bg-[#C9F7F5] text-success rounded cursor-pointer group",
                  Store.isLoadingCustomers ||
                    Store.isLoadingIncomes ||
                    Store.isLoadingMembers ||
                    Store.isLoadingSells ||
                    Store.isLoadingServices ||
                    textSpeechMutation?.isPending
                    ? "is-loading"
                    : "not-loading"
                )}
                onClick={() => TextToSpeech()}
              >
                <div className="group-[.is-loading]:block hidden" role="status">
                  <svg
                    aria-hidden="true"
                    className="w-4 text-gray-200 animate-spin dark:text-gray-600 fill-success"
                    viewBox="0 0 100 101"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                      fill="currentColor"
                    />
                    <path
                      d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                      fill="currentFill"
                    />
                  </svg>
                  <span className="sr-only">Loading...</span>
                </div>
                <PlayIcon className="w-5 group-[.not-loading]:block hidden" />
              </button>
            )}

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
