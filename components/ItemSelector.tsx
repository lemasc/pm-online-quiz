import { useExamQuery } from "@/shared/exam";
import { quizItemStore, quizStore } from "@/shared/store";
import React, { useCallback, useEffect } from "react";
import SwiperClass, { Virtual, Navigation } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";

const CoreItemButton = React.memo(function CoreItemButton({
  isCurrent,
  index,
  isAnswered,
}: {
  index: number;
  isAnswered: boolean;
  isCurrent: boolean;
}) {
  const { shallowReplace } = useExamQuery();
  const onClick = useCallback(
    () => shallowReplace(index),
    [index, shallowReplace]
  );
  return (
    <div
      key={index}
      className="flex flex-col items-center justify-center w-full"
    >
      <button
        className={`select-none m-4 item-circle border ${
          isCurrent
            ? "border-quiz-blue-400 bg-quiz-blue-400 text-white"
            : isAnswered
            ? "border-green-600 bg-green-600 text-white"
            : "border-gray-400 text-gray-500 hover:bg-gray-400 hover:text-white"
        }`}
        onClick={onClick}
      >
        {index}
      </button>
    </div>
  );
});

const ItemButton = React.memo(function ItemButton({
  index,
}: {
  index: number;
}) {
  const itemData = quizStore(
    React.useCallback((state) => state.items.get(index), [index])
  );
  const currentItem = quizStore(useCallback((state) => state.currentItem, []));
  const isAnswered = itemData && itemData.selected !== -1;

  return (
    <CoreItemButton
      isAnswered={!!isAnswered}
      index={index}
      isCurrent={currentItem === index}
    />
  );
});

enum BP {
  SM = 640,
  MD = 768,
  LG = 1024,
  XL = 1280,
  "2XL" = 1536,
}

const breakpoints = {
  [BP["SM"]]: {
    slidesPerView: 6,
    slidesPerGroup: 6,
  },
  [BP["MD"]]: {
    slidesPerView: 8,
    slidesPerGroup: 8,
  },
  [BP["LG"]]: {
    slidesPerView: 5,
    slidesPerGroup: 5,
  },
  [BP["XL"]]: {
    slidesPerView: 8,
    slidesPerGroup: 8,
  },
  [BP["2XL"]]: {
    slidesPerView: 10,
    slidesPerGroup: 10,
  },
};

const ItemSelector = React.memo(function ItemSelector({
  size,
}: {
  size: number;
}) {
  const swiperRef = React.useRef<SwiperClass>();
  const slides = Array.from(Array(size).keys()).map((index) => (
    <ItemButton key={"item" + index + 1} index={index + 1} />
  ));

  useEffect(
    () =>
      quizItemStore.subscribe((state) => {
        try {
          swiperRef.current?.slideTo(state.item - 1);
        } catch {}
      }),
    []
  );

  return (
    <div className="flex items-center justify-center w-full">
      <div className="my-4 relative max-w-3xl w-full">
        <Swiper
          scrollbar
          modules={[Navigation, Virtual]}
          navigation
          slidesPerView={4}
          slidesPerGroup={4}
          virtual
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          onInit={(swiper) => {
            const currentItem = quizStore.getState().currentItem;
            if (currentItem !== 0) {
              swiper.slideTo(currentItem - 1);
            }
          }}
          breakpoints={breakpoints}
        >
          {slides.map((slideContent, index) => (
            <SwiperSlide key={"slide" + index} virtualIndex={index}>
              {slideContent}
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
});
export default ItemSelector;
