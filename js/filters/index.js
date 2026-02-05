/*
 * 🎓 [종례 시간] 필터 조립하기
 * 파일명: js/filters/index.js
 * 
 * "각 교시(모듈)마다 배운 내용을 순서대로 적용해서 멋진 작품을 완성해요!"
 */

window.FilterUtils = {
    /**
     * 🎨 모든 필터 적용 ("종합 선물 세트")
     * 
     * @param {cv.Mat} src - 원본 이미지
     * @param {Object} options - 필터 옵션들
     * @returns {cv.Mat} - 모든 효과가 적용된 최종 이미지
     */
    applyAll: function(src, options) {
        // 작업을 시작하기 전에 원본을 복사해서 씁니다. (원본 훼손 방지)
        let currentImage = src.clone();
        
        // 중간 과정에서 생긴 이미지는 꼭 지워줘야 메모리가 낭비되지 않아요.
        // 다음 단계로 넘어가면 이전 단계의 이미지는 삭제!
        const updateImage = (newImage) => {
            if (currentImage !== newImage) {
                currentImage.delete();
                currentImage = newImage;
            }
        };

        // 1교시: 모양 잡기 (transform.js)
        if (window.FilterModules.transform) {
            const transformed = window.FilterModules.transform.apply(
                currentImage, 
                options.rotation, 
                options.flipH, 
                options.flipV
            );
            updateImage(transformed);
        }

        // 2교시: 질감 표현 (texture.js)
        if (window.FilterModules.texture) {
            // 블러
            if (options.blur > 0) {
                const blurred = window.FilterModules.texture.applyBlur(currentImage, options.blur);
                updateImage(blurred);
            }
            // 샤프닝
            if (options.sharpen > 0) {
                const sharpened = window.FilterModules.texture.applySharpen(currentImage, options.sharpen);
                updateImage(sharpened);
            }
        }

        // 3교시: 색상 입히기 (color.js)
        if (window.FilterModules.color) {
            // 색상 모드, 이진화, 스팟 컬러 등이 모두 여기서 처리됩니다.
            const colored = window.FilterModules.color.apply(currentImage, options);
            updateImage(colored);
        }

        // 4교시: 꾸미기 (contour.js)
        // 윤곽선 오버레이 또는 엣지 감지가 활성화된 경우에만 적용
        if (window.FilterModules.contour) {
            if (options.contour || options.edge) {
                const contoured = window.FilterModules.contour.apply(currentImage, options.contour, options.edge);
                updateImage(contoured);
            }
        }

        return currentImage;
    }
};
