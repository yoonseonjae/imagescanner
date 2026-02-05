/*
 * 👓 [4교시] 특별 활동: 투시 안경 만들기 (윤곽선 오버레이)
 * 파일명: js/filters/contour.js
 * 
 * "사물의 테두리만 찾아서 초록색 펜으로 덧칠해줍니다!"
 */

window.FilterModules = window.FilterModules || {};

window.FilterModules.contour = {
    /**
     * 🟢 윤곽선 그리기 (Contour Overlay)
     * 이미지에서 물체의 외곽선을 찾아서 표시해줍니다.
     * 
     * @param {cv.Mat} src - 입력 이미지
     * @param {boolean} contourEnabled - 윤곽선 오버레이가 켜져 있는지
     * @param {boolean} edgeDetectionOn - 엣지 감지 모드가 켜져 있는지
     */
    apply: function(src, contourEnabled, edgeDetectionOn) {
        // 윤곽선 오버레이가 꺼져 있고, 엣지 감지도 꺼져 있으면 원본 복사본 반환
        if (!contourEnabled && !edgeDetectionOn) {
            return src.clone();
        }
        
        // 엣지 감지 모드(흰 바탕에 검은 선)일 때는 굳이 초록선을 그리지 않아도 돼요.
        if (edgeDetectionOn) {
            // [배운 내용] Canny Edge Detection
            // 엣지만 남기고 싶다면 Canny 함수를 바로 씁니다.
            const gray = new cv.Mat();
            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
            const edges = new cv.Mat();
            cv.Canny(gray, edges, 50, 150);
            
            const result = new cv.Mat();
            cv.cvtColor(edges, result, cv.COLOR_GRAY2RGBA);
            
            gray.delete();
            edges.delete();
            return result;
        }

        // 여기서부터는 '원본 위에 초록선 덧그리기' 로직입니다.
        // 항상 새로운 Mat을 생성하여 중첩 방지
        const dst = src.clone();
        
        // 1. 엣지를 찾기 위해 흑백으로 변환
        const gray = new cv.Mat();
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
        
        // 2. 노이즈 제거 (블러) - 너무 자잘한 선은 무시하려고요.
        const blurred = new cv.Mat();
        cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
        
        // 3. 엣지 검출
        const edges = new cv.Mat();
        cv.Canny(blurred, edges, 50, 150);
        
        // 4. 윤곽선(Contours) 찾기 - 점들의 집합으로 변환
        const contours = new cv.MatVector();
        const hierarchy = new cv.Mat();
        cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
        
        // 5. 그리기 (Draw) - 초록색(0, 255, 0), 두께 2
        cv.drawContours(dst, contours, -1, new cv.Scalar(0, 255, 0, 255), 2);
        
        // 정리
        gray.delete();
        blurred.delete();
        edges.delete();
        contours.delete();
        hierarchy.delete();
        
        return dst;
    }
};
