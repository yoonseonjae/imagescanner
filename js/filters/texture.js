/*
 * 🎨 [2교시] 미술 시간: 질감 표현하기 (블러와 샤프닝)
 * 파일명: js/filters/texture.js
 * 
 * "피부를 뽀샤시하게 만들거나, 눈매를 또렷하게 만들어봐요!"
 */

window.FilterModules = window.FilterModules || {};

window.FilterModules.texture = {
    /**
     * ☁️ 블러 효과 (Blur)
     * 이미지를 흐릿하게 만듭니다. 노이즈를 없앨 때 좋아요.
     * 
     * @param {cv.Mat} src - 입력 이미지
     * @param {number} amount - 흐림 강도 (0~20)
     */
    applyBlur: function(src, amount) {
        if (amount <= 0) return src.clone();

        const ksize = amount * 2 + 1; // 붓 크기 (항상 홀수여야 해요! 3, 5, 7...)
        const dst = new cv.Mat();
        
        // [배운 내용] '가우시안 블러(Gaussian Blur)'
        // 픽셀 주변값들의 평균을 구해서 부드럽게 뭉갭니다.
        cv.GaussianBlur(src, dst, new cv.Size(ksize, ksize), 0);
        
        return dst;
    },

    /**
     * 🔪 샤프닝 (Sharpening)
     * 이미지를 날카롭고 선명하게 만듭니다.
     * 
     * @param {cv.Mat} src - 입력 이미지
     * @param {number} amount - 선명도 강도 (0~100)
     */
    applySharpen: function(src, amount) {
        if (amount <= 0) return src.clone();

        const blurred = new cv.Mat();
        // 1단계: 살짝 흐리게 만든 버전을 준비해요.
        cv.GaussianBlur(src, blurred, new cv.Size(0, 0), 3);
        
        const dst = new cv.Mat();
        
        // 2단계: 원본에서 흐린 버전을 빼듯이 합성해요.
        // [배운 내용] '언샤프 마스킹(Unsharp Masking)' 공식
        // 선명한 이미지 = 원본 * (1 + a) - 블러 * a
        // (가운데는 더 강조하고, 주변부는 깎아내는 원리)
        const alpha = 1 + amount / 50;
        const beta = -(amount / 50);
        
        cv.addWeighted(src, alpha, blurred, beta, 0, dst);
        
        blurred.delete(); // 다 쓴 붓은 씻어서 정리!
        return dst;
    }
};
