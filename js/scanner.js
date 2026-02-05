/*
 * 📘 수업 시간에 배운 내용 실습하기: 문서 스캐너 핵심 로직
 * 파일명: js/scanner.js
 * 
 * "Canny Edge Detection 알고리즘을 사용하여 문서를 정밀하게 감지합니다."
 * 
 * 주요 기능:
 * 1. 문서 찾기 (findDocument): Canny Edge -> Dilate -> Contours
 * 2. 문서 펴기 (scanDocument): Perspective Transform
 */

window.ScannerUtils = {
    /**
     * 🔍 1단계: 문서의 테두리 찾기 (findDocument)
     * Canny Edge Detection을 사용하여 문서의 윤곽선을 찾습니다.
     */
    findDocument: function(src) {
        // [Reference] Working Version Logic:
        // 1. Grayscale
        // 2. GaussianBlur (5x5)
        // 3. Canny (50, 150)
        // 4. Dilate (to close gaps)
        // 5. FindContours
        // 6. Find Largest Quad

        let gray = new cv.Mat();
        let blurred = new cv.Mat();
        let edges = new cv.Mat();
        let dilated = new cv.Mat();
        
        // 1. 흑백 변환
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
        
        // 2. 가우시안 블러
        cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
        
        // 3. 캐니 엣지 검출
        // threshold1: 50, threshold2: 150
        cv.Canny(blurred, edges, 50, 150);
        
        // 4. 모폴로지 연산 (팽창) - 끊어진 엣지 연결
        let kernel = cv.Mat.ones(3, 3, cv.CV_8U);
        cv.dilate(edges, dilated, kernel);
        
        // 5. 윤곽선 검출
        let contours = new cv.MatVector();
        let hierarchy = new cv.Mat();
        cv.findContours(dilated, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
        
        // 6. 가장 큰 사각형 찾기
        let maxArea = 0;
        let bestContour = null;
        let imageArea = src.rows * src.cols;
        
        for (let i = 0; i < contours.size(); i++) {
            let contour = contours.get(i);
            let area = cv.contourArea(contour);
            
            // 이미지 면적의 10% 이상인 윤곽선만 고려
            if (area < imageArea * 0.1) continue;
            
            let peri = cv.arcLength(contour, true);
            let approx = new cv.Mat();
            cv.approxPolyDP(contour, approx, 0.02 * peri, true);
            
            // 4개의 꼭지점을 가지고 있고 가장 큰 면적인 경우
            if (approx.rows === 4 && area > maxArea) {
                // 볼록한지 체크 (선택 사항이지만 안전을 위해)
                if (cv.isContourConvex(approx)) {
                    maxArea = area;
                    if (bestContour) bestContour.delete();
                    bestContour = approx.clone();
                }
            }
            approx.delete();
        }
        
        // 메모리 정리
        gray.delete();
        blurred.delete();
        edges.delete();
        dilated.delete();
        kernel.delete();
        contours.delete();
        hierarchy.delete();
        
        if (bestContour) {
            console.log(`[감지 성공] 면적: ${maxArea}`);
            return {
                contour: bestContour,
                area: maxArea
            };
        }
        
        return null; // 못 찾으면 null 반환
    },

    /**
     * 📐 2단계: 문서 펴기 (scanDocument)
     * 감지된 4개의 점을 기준으로 원근 변환(Perspective Transform)을 수행합니다.
     */
    scanDocument: function(src, contour) {
        // [Reference] Working Version Logic:
        // 1. Order Points
        // 2. Calculate Width/Height
        // 3. Get Perspective Transform Matrix
        // 4. Warp Perspective

        // contour가 Mat 형식이므로 데이터를 배열로 변환
        let points = [];
        for (let i = 0; i < 4; i++) {
            points.push(contour.data32S[i * 2]);     // x
            points.push(contour.data32S[i * 2 + 1]); // y
        }
        
        const ordered = this.orderPoints(points); // [tl, tr, br, bl] 객체 배열 반환
        
        // 출력 크기 계산
        const widthTop = Math.sqrt(
            Math.pow(ordered[1].x - ordered[0].x, 2) + 
            Math.pow(ordered[1].y - ordered[0].y, 2)
        );
        const widthBottom = Math.sqrt(
            Math.pow(ordered[2].x - ordered[3].x, 2) + 
            Math.pow(ordered[2].y - ordered[3].y, 2)
        );
        const maxWidth = Math.max(widthTop, widthBottom);
        
        const heightLeft = Math.sqrt(
            Math.pow(ordered[3].x - ordered[0].x, 2) + 
            Math.pow(ordered[3].y - ordered[0].y, 2)
        );
        const heightRight = Math.sqrt(
            Math.pow(ordered[2].x - ordered[1].x, 2) + 
            Math.pow(ordered[2].y - ordered[1].y, 2)
        );
        const maxHeight = Math.max(heightLeft, heightRight);
        
        // 소스 및 목적지 좌표 설정
        // cv.warpPerspective를 위해 Float32Array 형식의 Mat이 필요합니다.
        const srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
            ordered[0].x, ordered[0].y, // TL
            ordered[1].x, ordered[1].y, // TR
            ordered[2].x, ordered[2].y, // BR
            ordered[3].x, ordered[3].y  // BL
        ]);
        
        const dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
            0, 0,
            maxWidth - 1, 0,
            maxWidth - 1, maxHeight - 1,
            0, maxHeight - 1
        ]);
        
        // 변환 행렬 계산 및 적용
        const M = cv.getPerspectiveTransform(srcPoints, dstPoints);
        const dst = new cv.Mat();
        cv.warpPerspective(src, dst, M, new cv.Size(maxWidth, maxHeight));
        
        // 메모리 정리
        srcPoints.delete();
        dstPoints.delete();
        M.delete();
        
        return dst;
    },

    /**
     * 🧩 도우미 함수: 점 순서 정렬하기
     * 좌상 -> 우상 -> 우하 -> 좌하 순서로 정렬
     */
    orderPoints: function(pointsInput) {
        // pointsInput은 [x1, y1, x2, y2, x3, y3, x4, y4] 형식의 배열이거나
        // 객체 배열일 수 있습니다. 여기서는 배열로 들어온다고 가정하고 처리합니다.
        
        const pts = [];
        // 입력이 단순 배열인 경우 객체 배열로 변환
        if (typeof pointsInput[0] === 'number') {
             for (let i = 0; i < 4; i++) {
                pts.push({
                    x: pointsInput[i * 2],
                    y: pointsInput[i * 2 + 1]
                });
            }
        } else {
            // 이미 객체라면 복사
            pts.push(...pointsInput);
        }

        // 1. x + y 합이 가장 작은 것이 좌상단 (Top-Left)
        // 2. x + y 합이 가장 큰 것이 우하단 (Bottom-Right)
        pts.sort((a, b) => (a.x + a.y) - (b.x + b.y));
        const topLeft = pts[0];
        const bottomRight = pts[3];
        
        // 3. 나머지 두 점 중 y가 작은 것이 우상단 (Top-Right)
        const remaining = [pts[1], pts[2]];
        
        remaining.sort((a, b) => a.y - b.y);
        const topRight = remaining[0];
        const bottomLeft = remaining[1];
        
        // 순서: TL, TR, BR, BL
        return [topLeft, topRight, bottomRight, bottomLeft];
    }
};
