/*
 * 🧪 [3교시] 과학 시간: 빛의 색깔 실험실 (색상과 이진화)
 * 파일명: js/filters/color.js
 * 
 * "흑백 사진으로 만들거나, 빨간펜 선생님처럼 특정 색만 남겨봐요!"
 */

window.FilterModules = window.FilterModules || {};

window.FilterModules.color = {
    /**
     * 🌈 색상 모드 변경 종합 함수
     * @param options { mode, intensity, adaptive, blockSize, spotColor }
     */
    apply: function(src, options) {
        // 1. 스팟 컬러 (특별한 경우)
        if (options.spotColor && options.spotColor !== 'none') {
            return this.applySpotColor(src, options.spotColor);
        }

        // 2. 일반 색상 모드 (원본, 흑백, 스캔)
        let processed;
        
        if (options.mode === 'original') {
            processed = src.clone();
        } else if (options.mode === 'grayscale') {
            // [배운 내용] 흑백 변환 (RGB -> Gray)
            // 우리 눈은 밝기에 민감해서 색 정보를 버려도 잘 알아볼 수 있어요.
            const gray = new cv.Mat();
            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
            processed = new cv.Mat();
            cv.cvtColor(gray, processed, cv.COLOR_GRAY2RGBA); // 화면에 보여주기 위해 다시 4채널로
            gray.delete();
        } else if (options.mode === 'scan') {
            // [배운 내용] 이진화 (Thresholding)
            // 기준값(intensity)보다 밝으면 흰색, 어두우면 검은색! 딱 두 가지로 나눕니다.
            const gray = new cv.Mat();
            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
            const binary = new cv.Mat();
            cv.threshold(gray, binary, options.intensity, 255, cv.THRESH_BINARY);
            
            processed = new cv.Mat();
            cv.cvtColor(binary, processed, cv.COLOR_GRAY2RGBA);
            gray.delete();
            binary.delete();
        } else {
            processed = src.clone(); // 혹시 모를 기본값
        }

        // 3. 적응형 이진화 (더 똑똑한 스캐너)
        // 그림자 진 문서도 깨끗하게 스캔하고 싶을 때 사용해요.
        if (options.adaptive) {
            const gray = new cv.Mat();
            
            // 입력이 이미 흑백이라도 확실하게 1채널로 변환
            if (processed.channels() === 1) processed.copyTo(gray);
            else cv.cvtColor(processed, gray, cv.COLOR_RGBA2GRAY);

            const binary = new cv.Mat();
            const blockSize = options.blockSize % 2 === 0 ? options.blockSize + 1 : options.blockSize;
            
            // [배운 내용] Adaptive Threshold
            // "내 주변 친구들의 평균 밝기"와 비교해서 흑백을 결정하니까, 그림자가 져도 글자가 잘 보여요!
            cv.adaptiveThreshold(gray, binary, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, blockSize, 2);
            
            // 기존 processed 삭제 후 교체
            processed.delete();
            processed = new cv.Mat();
            cv.cvtColor(binary, processed, cv.COLOR_GRAY2RGBA);
            
            gray.delete();
            binary.delete();
        }
        
        // 4. 대비 조절 (Contrast)
        if (options.contrast !== 100) {
            const contrast = options.contrast / 100;
            const adjusted = new cv.Mat();
            // 픽셀 값에 곱하기(contrast)를 해서 차이를 벌려줍니다.
            processed.convertTo(adjusted, -1, contrast, 128 * (1 - contrast));
            
            processed.delete();
            processed = adjusted;
        }

        return processed;
    },

    /**
     * 🖍️ 스팟 컬러 (Spot Color)
     * 선택한 색상만 살리고 나머지는 흑백으로 만듭니다.
     * 
     * [심화 학습] 픽셀 하나하나를 직접 검사하는 '순회(Iteration)' 방식입니다.
     */
    applySpotColor: function(src, color) {
        // 먼저 흑백 버전을 만들어둡니다.
        const gray = new cv.Mat();
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
        const result = new cv.Mat();
        cv.cvtColor(gray, result, cv.COLOR_GRAY2RGBA);
        
        const rows = src.rows;
        const cols = src.cols;
        
        // 모든 픽셀을 방문합니다! (이중 for문)
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                // 현재 픽셀의 빨강, 초록, 파랑 값을 읽어옵니다.
                const r = src.ucharPtr(i, j)[0];
                const g = src.ucharPtr(i, j)[1];
                const b = src.ucharPtr(i, j)[2];
                
                let keepColor = false;
                const threshold = 30; // "얼마나 더 진해야 인정해줄까?" 하는 기준값
                
                // 비교 로직: "내가 주인공이냐?"
                if (color === 'red' && r > g + threshold && r > b + threshold) keepColor = true;
                else if (color === 'green' && g > r + threshold && g > b + threshold) keepColor = true;
                else if (color === 'blue' && b > r + threshold && b > g + threshold) keepColor = true;
                
                // 주인공 색깔이라면, 흑백 이미지 위에 원본 색을 다시 칠해줍니다.
                if (keepColor) {
                    result.ucharPtr(i, j)[0] = r;
                    result.ucharPtr(i, j)[1] = g;
                    result.ucharPtr(i, j)[2] = b;
                }
            }
        }
        
        gray.delete();
        return result;
    }
};
