/*
 * 🤸 [1교시] 체육 시간: 이미지 몸 풀기 (회전과 대칭)
 * 파일명: js/filters/transform.js
 * 
 * "본격적으로 꾸미기 전에 이미지를 바른 자세로 잡아줍니다!"
 */

// 모듈 저장소 초기화 (없으면 새로 만듬)
window.FilterModules = window.FilterModules || {};

window.FilterModules.transform = {
    /**
     * 🔄 회전 및 대칭 (Rotate & Flip)
     * 이미지를 돌리거나 거울처럼 뒤집습니다.
     * 
     * @param {cv.Mat} src - 입력 이미지
     * @param {number} angle - 회전 각도 (0, 90, 180, 270)
     * @param {boolean} flipH - 좌우 대칭 여부
     * @param {boolean} flipV - 상하 대칭 여부
     */
    apply: function(src, angle, flipH, flipV) {
        let processed = src;
        let matToDelete = null; // 중간에 생긴 임시 이미지를 기억했다가 지워야 해요.

        // 1. 회전하기
        if (angle !== 0) {
            const center = new cv.Point(processed.cols / 2, processed.rows / 2);
            
            // [배운 내용] '아핀 변환 행렬' 구하기
            // 중심점을 기준으로 반시계 방향으로 회전시키는 행렬을 만듭니다.
            const M = cv.getRotationMatrix2D(center, -angle, 1);
            const rotated = new cv.Mat();
            
            // 이미지 변형 실행!
            cv.warpAffine(processed, rotated, M, new cv.Size(processed.cols, processed.rows));
            
            // 원본이 아니면(중간 결과물이면) 삭제
            if (matToDelete) matToDelete.delete();
            matToDelete = rotated;
            processed = rotated;
            
            M.delete(); // 행렬도 지워줍니다.
        }

        // 2. 대칭(반전)시키기
        if (flipH || flipV) {
            const flipped = new cv.Mat();
            let flipCode = 0;
            // flipCode 약속: 0은 상하, 1은 좌우, -1은 둘 다
            if (flipH && flipV) flipCode = -1;
            else if (flipH) flipCode = 1;
            else if (flipV) flipCode = 0;

            cv.flip(processed, flipped, flipCode);
            
            if (matToDelete) matToDelete.delete();
            matToDelete = flipped;
            processed = flipped;
        }

        // 처리된 이미지만 반환하고, 중간 단계 이미지는 함수 밖에서 관리하도록 합니다.
        // 주의: 이 함수는 새로운 Mat을 만들어서 리턴할 수도, 입력 그대로 리턴할 수도 있습니다.
        // 호출하는 쪽에서 clone 확인이 필요합니다.
        
        // 안전하게 항상 복사본을 리턴하거나, 호출자가 관리하게 해야 하는데,
        // 여기서는 '새로 만들어진 놈'이면 그냥 리턴, '입력 그대로'면 clone해서 리턴하는 게 안전합니다.
        // (입력 src를 건드리지 않는 순수 함수처럼 동작하기 위해)
        if (processed === src) {
            return src.clone();
        }
        return processed;
    }
};
