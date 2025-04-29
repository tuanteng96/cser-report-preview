import React, { useEffect, useState } from "react";
import { useAuth } from "src/app/_ezs/core/Auth";
import {
  Customers,
  Incomes,
  Members,
  PickerFilterReport,
  PickerViewStock,
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
  Bars3Icon,
  ChevronDownIcon,
  PlayIcon,
} from "@heroicons/react/24/outline";
import { useRoles } from "src/app/_ezs/hooks/useRoles";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ReportContext } from "src/app/_ezs/contexts";
import { formatString } from "src/app/_ezs/utils/formatString";
import ConfigAPI from "src/app/_ezs/api/config.api";
import axios from "axios";
import clsx from "clsx";
import { useWindowSize } from "src/app/_ezs/hooks/useWindowSize";
import { NavLink } from "react-router-dom";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import Swal from "sweetalert2";
import { toAbsoluteUrl } from "src/app/_ezs/utils/assetPath";

const hasRouter = () => {
  return "/admin/?mdl20=R23&act20=index#rp:";
};

function ReportPreview(props) {
  let { CrStocks, GlobalConfig, Stocks, accessToken } = useAuth();
  const queryClient = useQueryClient();
  const { width } = useWindowSize();
  const { report, bao_cao_ngay_tong_quan } = useRoles([
    "bao_cao_ngay_tong_quan",
    "report",
  ]);
  const [isShowMobile, setIsShowMobile] = useState(false);
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
    SellsChart: null,
    isLoadingCustomers: true,
    isLoadingIncomes: true,
    isLoadingSells: true,
    isLoadingServices: true,
    isLoadingMembers: true,
    isLoadingSellsChart: true,
  });

  const [currentMusic, setCurrentMusic] = useState({
    string: "",
    prevSrc: "",
    src: "",
  });

  const [MenuList, setMenuList] = useState([
    {
      Title: "Báo cáo ngày",
      TitleKey: "BAO_CAO_NGAY",
      IconClass: "fa-regular fa-chart-pie icon",
      Href: hasRouter() + "/bao-cao-ngay",
      Children: [
        {
          Title: "Tổng quan",
          Href: hasRouter() + "/bao-cao-ngay/tong-quan",
        },
        {
          Title: "Khách hàng",
          Href: hasRouter() + "/bao-cao-ngay/khach-hang",
        },
      ],
    },
    {
      Title: "Khách hàng",
      TitleKey: "KHACH_HANG",
      IconClass: "fa-regular fa-chart-user icon",
      Href: hasRouter() + "/khach-hang",
      Children: [
        {
          Title: "Tổng quan khách hàng",
          Href: hasRouter() + "/khach-hang/tong-quan",
        },
        {
          Title: "Tổng hợp khách hàng",
          Href: hasRouter() + "/khach-hang/tong-hop",
        },
        {
          Title: "Chi tiêu",
          Href: hasRouter() + "/khach-hang/chi-tieu",
        },
        {
          Title: "Sử dụng dịch vụ",
          Href: hasRouter() + "/khach-hang/su-dung-dich-vu",
        },
        {
          Title: "Dự kiến",
          Href: hasRouter() + "/khach-hang/du-kien",
        },
        {
          Title: "Tần suất sử dụng",
          Href: hasRouter() + "/khach-hang/tan-suat-su-dung",
        },
        {
          Title: "Chuyển đổi",
          Href: hasRouter() + "/khach-hang/chuyen-doi",
        },
      ],
    },
    {
      Title: "Dịch vụ",
      TitleKey: "DICH_VU",
      IconClass: "fa-regular fa-chart-waterfall icon",
      Href: hasRouter() + "/dich-vu",
      Children: [
        {
          Title: "Tổng quan - Doanh số",
          Href: hasRouter() + "/dich-vu/tong-quan",
        },
        {
          Title: "Báo cáo nghiệp vụ",
          Href: hasRouter() + "/dich-vu/bao-cao-nghiep-vu",
        },
        {
          Title: "Dịch vụ điểm này, sử dụng điểm khác",
          Href: hasRouter() + "/dich-vu/dv-diem-sd-diem-khac",
        },
        {
          Title: "Tồn dịch vụ",
          Href: hasRouter() + "/dich-vu/ton-dich-vu",
        },
        {
          Title: "Báo cáo đặt lịch",
          Href: hasRouter() + "/dich-vu/bao-cao-dat-lich",
        },
      ],
    },
    {
      Title: "Bán hàng",
      TitleKey: "BAN_HANG",
      IconClass: "fa-regular fa-cart-circle-check icon",
      Href: hasRouter() + "/ban-hang",
      Children: [
        {
          Title: "Doanh số",
          Href: hasRouter() + "/ban-hang/doanh-so",
        },
        {
          Title: "Doanh số mới",
          Href: hasRouter() + "/ban-hang/ds-bc-2",
          hidden: !GlobalConfig?.Admin?.bao_cao_mely,
        },
        {
          Title: "Sản phẩm, dịch vụ bán ra",
          Href: hasRouter() + "/ban-hang/sp-dv-ban-ra",
        },
        {
          Title: "Trả hàng",
          Href: hasRouter() + "/ban-hang/tra-hang",
        },
        {
          Title: "Thanh toán trả nợ",
          Href: hasRouter() + "/ban-hang/thanh-toan-tra-no",
        },
        {
          Title: "Top bán hàng, doanh số",
          Href: hasRouter() + "/ban-hang/top-ban-hang-doanh-so",
        },
        {
          Title: "Doanh số giảm trừ ( kết thúc thẻ, xóa buổi )",
          Href: hasRouter() + "/ban-hang/doanh-so-giam-tru",
        },
        {
          Title: "Bảng giá",
          Href: hasRouter() + "/ban-hang/bang-gia",
        },
        {
          Title: "Lợi nhuận",
          Href: hasRouter() + "/ban-hang/loi-nhuan",
        },
        {
          Title: "Doanh số thực thu",
          Href: hasRouter() + "/ban-hang/doanh-so-thuc-thu",
        },
      ],
    },
    {
      Title: "Thu chi & Sổ quỹ",
      TitleKey: "BAO_CAO_THU_CHI",
      IconClass: "fa-regular fa-piggy-bank icon",
      Href: hasRouter() + "/bao-cao-thu-chi",
      Children: [
        {
          Title: "Thu chi & Sổ quỹ",
          Href: hasRouter() + "/bao-cao-thu-chi/tong-quan",
        },
        {
          Title: "Thanh toán các phương thức chuyển khoản",
          Href: hasRouter() + "/bao-cao-thu-chi/cac-phuong-thuc-thanh-toan",
        },
      ],
    },
    {
      Title: "Công nợ",
      TitleKey: "CONG_NO",
      IconClass: "fa-regular fa-chart-mixed icon",
      Href: hasRouter() + "/cong-no",
      Children: [
        {
          Title: "Công nợ",
          Href: hasRouter() + "/cong-no/danh-sach",
        },
        {
          Title: "Báo cáo khóa nợ",
          Href: hasRouter() + "/cong-no/khoa-no",
        },
        {
          Title: "Báo cáo tặng",
          Href: hasRouter() + "/cong-no/tang",
        },
      ],
    },
    {
      Title: "Nhân viên",
      TitleKey: "NHAN_VIEN",
      IconClass: "fa-regular fa-chart-candlestick icon",
      Href: hasRouter() + "/nhan-vien",
      Children: [
        {
          Title: "Lương ca dịch vụ",
          Href: hasRouter() + "/nhan-vien/luong-ca-dich-vu",
        },
        {
          Title: "Hoa hồng",
          Href: hasRouter() + "/nhan-vien/hoa-hong",
        },
        {
          Title: "Doanh số",
          Href: hasRouter() + "/nhan-vien/doanh-so",
        },
        {
          Title: "Bảng lương",
          Href: hasRouter() + "/nhan-vien/bang-luong",
        },
      ],
    },
    {
      Title: "Tồn kho",
      TitleKey: "TON_KHO",
      IconClass: "fa-regular fa-chart-pie icon",
      Href: hasRouter() + "/ton-kho",
      Children: [
        {
          Title: "Tồn kho",
          Href: hasRouter() + "/ton-kho/danh-sach",
        },
        {
          Title: "Tiêu hao",
          Href: hasRouter() + "/ton-kho/tieu-hao",
        },
        {
          Title: "Nguyên vật liệu dự kiến",
          Href: hasRouter() + "/ton-kho/du-kien-nvl",
        },
      ],
    },
    {
      Title: "CSKH",
      TitleKey: "CSKH",
      IconClass: "fa-regular fa-handshake icon",
      Href: hasRouter() + "/cskh",
      Children: [
        {
          Title: "Báo cáo cài đặt APP",
          Href: hasRouter() + "/cskh/bao-cao-cai-dat-app",
        },
        // {
        //   Title: 'Khách hàng sinh nhật',
        //   Href: '/cskh/khach-hang-sinh-nhat'
        // },
        // {
        //   Title: 'Khách hàng sắp lên cấp',
        //   Href: '/cskh/khach-hang-sap-len-cap'
        // },
        // {
        //   Title: 'Khách hàng hết sản phẩm',
        //   Href: '/cskh/khach-hang-het-san-pham'
        // },
        // {
        //   Title: 'Khách hết thẻ trong ngày',
        //   Href: '/cskh/khach-het-the-trong-ngay'
        // },
        // {
        //   Title: 'Thẻ sắp hết hạn',
        //   Href: '/cskh/the-sap-het-han'
        // },
        // {
        //   Title: 'Thời gian nghe Smart Call',
        //   Href: '/cskh/thoi-gian-nghe-smart-call'
        // },
        // {
        //   Title: 'Đánh giá dịch vụ',
        //   Href: '/cskh/danh-gia-dich-vu'
        // },
        // {
        //   Title: 'Chỉ sử dụng mã giảm giá',
        //   Href: '/cskh/chi-su-dung-ma-giam-gia'
        // },
        // {
        //   Title: 'Chỉ sử dụng buổi lẻ',
        //   Href: '/cskh/chi-su-dung-buoi-le'
        // },
        // {
        //   Title: 'Top ưu đãi sử dụng',
        //   Href: '/cskh/top-uu-dai-su-dung'
        // },
        // {
        //   Title: 'Tần suất sử dụng dịch vụ',
        //   Href: '/cskh/tan-suat-su-dunng-dich-vu'
        // }
      ],
    },
    {
      Title: "Khác",
      TitleKey: "KHAC",
      IconClass: "fa-regular fa-chart-scatter-bubble icon",
      Href: hasRouter() + "/khac",
      Children: [
        // {
        //   Title: 'Top đánh giá',
        //   Href: '/khac/top-danh-gia'
        // },
        // {
        //   Title: 'Dịch vụ đã bán chưa thực hiện',
        //   Href: '/khac/dich-vu-da-ban-chua-thuc-hien'
        // },
        {
          Title: "Báo cáo ví",
          Href: hasRouter() + "/khac/bao-cao-vi",
        },
        {
          Title: "Báo cáo thẻ tiền",
          Href: hasRouter() + "/khac/bao-cao-the-tien",
        },
        {
          Title: "Báo cáo sử dụng thẻ tiền",
          Href: hasRouter() + "/khac/bao-cao-su-dung-the-tien",
        },
        {
          Title: "Báo cáo khoá học",
          Href: hasRouter() + "/khac/bao-cao-khoa-hoc",
        },
        // {
        //   Title: 'Lợi nhuận',
        //   Href: '/khac/loi-nhuan'
        // }
      ],
    },
  ]);
  const [IndexShow, setIndexShow] = useState("BAO_CAO_NGAY");

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

  const SumKey = (keys) => {
    let total = 0;
    if (!keys || keys.length === 0) return total;
    for (let key of keys) {
      Object.keys(Store).every((s) => {
        if (typeof Store[s] === "object" && Array.isArray(Store[s])) {
          Store[s].every((group) => {
            if (group.KeyID === key) {
              total = total + group.GroupValue;
              return;
            }
            let index = group.Keys
              ? group.Keys.findIndex((x) => x.KeyID === key)
              : -1;
            if (index > -1) {
              total = total + group.Keys[index].Value?.Value;
              return;
            }

            return true;
          });
        }

        return true;
      });
    }
    return total >= 0 ? total : total * -1;
  };

  const TextToSpeech = (s) => {
    if (!GlobalConfig?.Admin?.TextToSpeech) return;
    let StocksFilters = [];
    let SalesRate = [0, 0, 0];
    let SalesTop = [
      ...(Store.SellsChart?.DV?.Items || []),
      ...(Store.SellsChart?.SP?.Items || []),
      ...(Store.SellsChart?.TT?.Items || []),
    ];

    SalesTop = SalesTop.sort((a, b) => b.SumTopay - a.SumTopay).slice(0, 5);

    if (
      Store.SellsChart?.TOTAL?.series &&
      Store.SellsChart?.TOTAL?.series.length > 0
    ) {
      const sum = Store.SellsChart?.TOTAL?.series.reduce(
        (partialSum, a) => partialSum + a,
        0
      );
      for (let [i, value] of Store.SellsChart?.TOTAL?.series.entries()) {
        SalesRate[i] = Math.round((value / sum) * 100);
      }
    }

    if (!filters.StockID) {
      StocksFilters.push("Toàn hệ thống");
    } else {
      for (let st of filters.StockID) {
        let index = Stocks.findIndex((x) => x.ID === Number(st));
        if (index > -1) StocksFilters.push(Stocks[index].Title);
      }
    }

    let text =
      "Xin chào, Báo cáo " +
      moment(filters.CrDate).format("[ngày] DD [tháng] MM [Năm] YYYY") +
      " tại " +
      StocksFilters.join(", ") +
      " .";
    text += `Về khách hàng. ${
      SumKey(["KHACH_TAO_MOI"]) > 0
        ? "Có [KHACH_TAO_MOI] khách được tạo mới trong đó [KHACH_DANG_KY_TU_WEB_APP] khách đăng ký qua web và app"
        : "Không có khách hàng được tạo mới"
    }. ${
      SumKey(["KHACH_TAI_APP"]) > 0
        ? "[KHACH_TAI_APP] khách tải app gồm [KHACH_CU_TAI_APP] khách cũ và [KHACH_MOI_TAI_APP] khách mới"
        : "Không có khách hàng tải APP"
    }. `;
    text += `Về doanh thu. ${
      SumKey(["DON_HANG_MOI"]) > 0
        ? `Bán mới Đạt [DON_HANG_MOI] đồng, chi phí giảm giá [GIAM_GIA] đồng, khách thanh toán thực tế là [THANH_TOAN_TM_CK_QT] đồng, thanh toán ${SumKey(
            ["THANH_TOAN_VI", "THANH_TOAN_THE_TIEN"]
          )} đồng đến từ ví và thẻ tiền, còn nợ lại [CON_NO_LAI] đồng`
        : "Không phát sinh doanh thu bán mới"
    }. ${
      SumKey(["THU_NO"]) > 0
        ? "Thu nợ cũ đạt [THU_NO] đồng trong đó gồm [THANH_TOAN_TM_CK_QT_] đồng, [THANH_TOAN_VI_] đồng từ ví và [THANH_TOAN_THE_TIEN_] đồng từ thẻ tiền."
        : "Không phát sinh thu nợ."
    } `;
    text += `Doanh thu bán mới theo tỉ lệ gồm ${SalesRate[1]}% dịch vụ, ${
      SalesRate[0]
    }% sản phẩm, ${
      SalesRate[2]
    }% thẻ tiền. Top 5 sản phẩm, dịch vụ chiếm doanh thu cao nhất gồm ${SalesTop.map(
      (x) => x.ProdTitle
    ).join(", ")}. `;
    text += `Về đặt lịch & dịch vụ. ${
      SumKey(["DAT_LICH"]) > 0
        ? `Có [DAT_LICH] đặt lịch, [KHACH_CO_DEN] khách đến theo lịch đặt, số khách đặt lịch không đến là [KHACH_KHONG_DEN], Hủy lịch [KHACH_HUY_LICH]`
        : "Không có đặt lịch mới"
    }. Có [DA_XONG] dịch vụ đã được thực hiện xong, [DANG_THUC_HIEN] dịch vụ đang thực hiện. `;
    text +=
      "Có [NHAN_VIEN_DI_LAM] nhân viên đi làm, đã về [DA_VE], còn lại [DANG_LAM_VIEC] người. Tổng lương ca dự kiến phải trả [TONG_LUONG_TOUR], Hoa hồng tư vấn bán sản phẩm, dịch vụ là [TONG_HOA_HONG].";

    let ListsFind = Array.from(text.matchAll(/\[([^\][]*)]/g), (x) => x[1]);

    const rs = {};
    if (ListsFind) {
      for (let key of ListsFind) {
        Object.keys(Store).every((s) => {
          if (typeof Store[s] === "object" && Array.isArray(Store[s])) {
            Store[s].every((group) => {
              if (group.KeyID === key) {
                rs[`[${key}]`] =
                  group.GroupValue >= 0
                    ? group.GroupValue
                    : group.GroupValue * -1;
                return;
              }
              let index = group.Keys
                ? group.Keys.findIndex((x) => x.KeyID === key)
                : -1;
              if (index > -1) {
                rs[`[${key}]`] =
                  group.Keys[index].Value?.Value >= 0
                    ? group.Keys[index].Value?.Value
                    : group.Keys[index].Value?.Value * -1;
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
            body: {
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
            Token: accessToken,
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
            body: {
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
            Token: accessToken,
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

  const OpenSubmenu = (key) => {
    if (key === IndexShow) {
      setIndexShow("");
    } else {
      setIndexShow(key);
    }
  };

  // useEffect(() => {
  //   if (
  //     bao_cao_ngay_tong_quan?.hasRight ||
  //     (report?.hasRight && report?.IsStocks)
  //   ) {
  //   } else {
  //     Swal.fire({
  //       icon: "error",
  //       title: "Yêu cầu quyền truy cập",
  //       text: "Để xem được báo cáo này bạn cần có quyền truy cập từ người quản trị.",
  //       footer: `<span class="text-danger">Yêu cầu quyền truy cập</span>`,
  //       showCancelButton: false,
  //       showConfirmButton: false,
  //       allowOutsideClick: false,
  //       customClass: {
  //         container: "swal-quyen",
  //       },
  //     });
  //   }
  // }, [report, bao_cao_ngay_tong_quan]);

  return (
    <ReportContext.Provider
      value={{ Store, setStore, currentMusic, setCurrentMusic }}
    >
      {width <= 1200 && (
        <div className={clsx("ezs-navbars-mobile", isShowMobile && "show")}>
          <div className="ezs-navbar-mobile">
            <ul className="ezs-navbars">
              {MenuList &&
                MenuList.map((item, index) => (
                  <li
                    className={clsx(
                      IndexShow === item.TitleKey && "menu-item-open"
                    )}
                    key={index}
                  >
                    {window.isApp ? (
                      <NavLink to={item.Href}>
                        <i className={item.IconClass}></i>
                        <span>{item.Title}</span>
                      </NavLink>
                    ) : (
                      <a
                        href="#"
                        onClick={() =>
                          (window.top.location.href =
                            item.TitleKey === "BAO_CAO_NGAY"
                              ? "/admin/?mdl20=R23&act20=daily"
                              : sub.Href)
                        }
                      >
                        <i className={item.IconClass}></i>
                        <span>{item.Title}</span>
                      </a>
                    )}

                    {item.Children && item.Children.length > 0 && (
                      <div
                        className="btn-down"
                        onClick={() => OpenSubmenu(item.TitleKey)}
                      >
                        <i className="fa-solid fa-chevron-down icon-down"></i>
                      </div>
                    )}
                    {item.Children && item.Children.length > 0 && (
                      <div className="ezs-navbar__sub">
                        <ul>
                          {item.Children.map((sub, i) => (
                            <li key={i}>
                              {window.isApp ? (
                                <NavLink
                                  to={
                                    sub.Href ===
                                    "/admin/?mdl20=R23&act20=index#rp:/bao-cao-ngay/tong-quan"
                                      ? "/admin/?mdl20=R23&act20=daily"
                                      : sub.Href
                                  }
                                >
                                  <i className="menu-bullet menu-bullet-dot">
                                    <span></span>
                                  </i>
                                  <span className="menu-text">{sub.Title}</span>
                                </NavLink>
                              ) : (
                                <a
                                  href="#"
                                  onClick={() =>
                                    (window.top.location.href =
                                      sub.Href ===
                                      "/admin/?mdl20=R23&act20=index#rp:/bao-cao-ngay/tong-quan"
                                        ? "/admin/?mdl20=R23&act20=daily"
                                        : sub.Href)
                                  }
                                >
                                  <i className="menu-bullet menu-bullet-dot">
                                    <span></span>
                                  </i>
                                  <span className="menu-text">{sub.Title}</span>
                                </a>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                ))}
            </ul>
          </div>
          <div
            className="navbar-overlay"
            onClick={() => setIsShowMobile(!isShowMobile)}
          ></div>
        </div>
      )}
      <div className="flex flex-col h-full">
        <div className="bg-white shadow-[0_10px_30px_0_rgba(82,63,105,.08)]">
          {width > 1200 && (
            <div className="px-4 border-b xl:px-6 h-[55px]">
              <ul className="flex ezs-navbar">
                {MenuList &&
                  MenuList.map((item, index) => (
                    <li key={index}>
                      {window.isApp ? (
                        <NavLink
                          className={clsx(
                            item.Href ===
                              "/admin/?mdl20=R23&act20=index#rp:/bao-cao-ngay" &&
                              "active"
                          )}
                          to={sub.Href}
                        >
                          <i className={item.IconClass}></i>
                          <span>{item.Title}</span>
                          {item.Children && item.Children.length > 0 && (
                            <i className="fa-solid fa-chevron-down icon-down"></i>
                          )}
                        </NavLink>
                      ) : (
                        <a
                          className={clsx(
                            item.Href ===
                              "/admin/?mdl20=R23&act20=index#rp:/bao-cao-ngay" &&
                              "active"
                          )}
                          href="#"
                          onClick={() =>
                            (window.top.location.href =
                              item.TitleKey === "BAO_CAO_NGAY"
                                ? "/admin/?mdl20=R23&act20=daily"
                                : sub.Href)
                          }
                        >
                          <i className={item.IconClass}></i>
                          <span>{item.Title}</span>
                          {item.Children && item.Children.length > 0 && (
                            <i className="fa-solid fa-chevron-down icon-down"></i>
                          )}
                        </a>
                      )}

                      {item.Children &&
                        item.Children.filter((x) => !x.hidden).length > 0 && (
                          <div className="ezs-navbar__sub">
                            <ul>
                              {item.Children.filter((x) => !x.hidden).map(
                                (sub, i) => (
                                  <li key={i}>
                                    {window.isApp ? (
                                      <NavLink
                                        className={clsx(
                                          sub.Href ===
                                            "/admin/?mdl20=R23&act20=index#rp:/bao-cao-ngay/tong-quan" &&
                                            "active"
                                        )}
                                        to={
                                          sub.Href ===
                                          "/admin/?mdl20=R23&act20=index#rp:/bao-cao-ngay/tong-quan"
                                            ? "/admin/?mdl20=R23&act20=daily"
                                            : sub.Href
                                        }
                                      >
                                        {sub.Title}
                                      </NavLink>
                                    ) : (
                                      <a
                                        href="#"
                                        className={clsx(
                                          sub.Href ===
                                            "/admin/?mdl20=R23&act20=index#rp:/bao-cao-ngay/tong-quan" &&
                                            "active"
                                        )}
                                        onClick={() =>
                                          (window.top.location.href =
                                            sub.Href ===
                                            "/admin/?mdl20=R23&act20=index#rp:/bao-cao-ngay/tong-quan"
                                              ? "/admin/?mdl20=R23&act20=daily"
                                              : sub.Href)
                                        }
                                      >
                                        {sub.Title}
                                      </a>
                                    )}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                    </li>
                  ))}
              </ul>
            </div>
          )}

          <div className="px-4 py-2 xl:px-6">
            <div className="flex items-center justify-between">
              <Menu>
                <MenuButton
                  disabled={
                    !(
                      bao_cao_ngay_tong_quan?.hasRight ||
                      (report?.hasRight && report?.IsStocks)
                    )
                  }
                >
                  <div className="flex items-center text-xl font-semibold lg:text-2xl">
                    <span className="hidden md:inline-block">Báo cáo tổng quan</span>
                    <span className="md:hidden">BC tổng quan</span>
                    <ChevronDownIcon className="w-5 ml-2" />
                  </div>
                </MenuButton>
                <MenuItems
                  className="px-0 py-1 bg-white border-0 rounded shadow-lg"
                  anchor="bottom"
                >
                  <MenuItem>
                    {({ close }) => (
                      <PickerViewStock onClose={close}>
                        {({ open }) => (
                          <button
                            type="button"
                            onClick={() => {
                              open();
                            }}
                            className="flex items-center px-5 py-2.5 text-[15px] min-w-[200px] hover:bg-[#F4F6FA] hover:text-primary font-inter transition cursor-pointer font-medium text-site-color"
                          >
                            Theo cơ sở
                          </button>
                        )}
                      </PickerViewStock>
                    )}
                  </MenuItem>
                </MenuItems>
              </Menu>

              <div className="hidden gap-2 lg:flex">
                {GlobalConfig?.Admin?.TextToSpeech ? (
                  <button
                    disabled={
                      Store.isLoadingCustomers ||
                      Store.isLoadingIncomes ||
                      Store.isLoadingMembers ||
                      Store.isLoadingSells ||
                      Store.isLoadingServices ||
                      Store.isLoadingSellsChart ||
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
                        Store.isLoadingSellsChart ||
                        textSpeechMutation?.isPending
                        ? "is-loading"
                        : "not-loading"
                    )}
                    onClick={() => TextToSpeech()}
                  >
                    <div
                      className="group-[.is-loading]:block hidden"
                      role="status"
                    >
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
                    disabled={
                      !(
                        bao_cao_ngay_tong_quan?.hasRight ||
                        (report?.hasRight && report?.IsStocks)
                      )
                    }
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
                  isDisabled={
                    !(
                      bao_cao_ngay_tong_quan?.hasRight ||
                      (report?.hasRight && report?.IsStocks)
                    )
                  }
                />
                {width <= 1200 && (
                  <div
                    className="flex items-center justify-center w-[50px] h-[50px] bg-[#6d757d] text-white rounded"
                    onClick={() => setIsShowMobile(true)}
                  >
                    <i className="fa-solid fa-bars text-[25px] mt-[4px]" />
                  </div>
                )}
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
                      Store.isLoadingSellsChart ||
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
                        Store.isLoadingSellsChart ||
                        textSpeechMutation?.isPending
                        ? "is-loading"
                        : "not-loading"
                    )}
                    onClick={() => TextToSpeech()}
                  >
                    <div
                      className="group-[.is-loading]:block hidden"
                      role="status"
                    >
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
                {!window.isApp && (
                  <div
                    className="flex items-center justify-center w-[40px] h-[40px] bg-[#6d757d] text-white rounded"
                    onClick={() => setIsShowMobile(true)}
                  >
                    <i className="fa-solid fa-bars text-[18px] mt-[4px]" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {bao_cao_ngay_tong_quan?.hasRight ||
        (report?.hasRight && report?.IsStocks) ? (
          <div className="p-4 overflow-auto xl:p-6 grow">
            <div className="flex flex-col gap-4 lg:grid lg:grid-cols-6 xl:gap-6">
              <Customers filters={filters} />
              <Sells filters={filters} />
              <Services filters={filters} />
              <Incomes filters={filters} />
              <Members filters={filters} />
            </div>
          </div>
        ) : (
          <div className="relative grow">
            <div className="absolute w-full max-w-2xl px-5 md:px-0 top-2/4 left-2/4 -translate-x-2/4 -translate-y-2/4">
              <div className="flex flex-col items-center justify-center px-5 pt-12 pb-10 bg-white rounded md:pt-20 md:px-10">
                <div className="mb-3 text-xl font-bold text-center md:text-2xl font-inter text-danger">
                  Không có quyền truy cập!
                </div>
                <div className="text-center text-gray-600 md:font-semibold md:w-10/12">
                  Bạn không có quyền để truy cập chức năng này. Vui lòng liên hệ
                  quản trị viên cấp quyền truy cập.
                </div>
                <div className="max-w-[150px] md:max-w-[200px]">
                  <img
                    className="w-full"
                    src={toAbsoluteUrl("images/membership.png")}
                    alt=""
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {currentMusic.src && <Player />}
    </ReportContext.Provider>
  );
}

export default ReportPreview;
