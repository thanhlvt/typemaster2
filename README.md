# TypeMaster 2 — Space Typing

Game luyện gõ 10 ngón dạng space shooter 3D chạy trên trình duyệt, xây bằng **Three.js + Vite + TypeScript**.

Tàu địch mang từ tiếng Anh bay về phía bạn — gõ chữ cái đầu để khóa mục tiêu, gõ hết từ để bắn hạ. Đừng để tàu địch chạm vào bạn (3 mạng).

## Chạy

```bash
npm install
npm run dev      # mở http://localhost:5173
npm run build    # build production vào dist/
```

## Lộ trình học 10 ngón

18 level mở khóa dần theo giáo trình touch-typing chuẩn:

- **Level 1–5:** home row (`f j` → `d k` → `s l` → `a` → `g h`)
- **Level 6–10:** top row (`e i` → `r u` → `t y` → `w o` → `q p`)
- **Level 11–14:** bottom row (`v m` → `c n` → `b` → `x z`)
- **Level 15–18:** luyện tốc độ với toàn bộ bàn phím

Level đầu dùng chuỗi drill xen kẽ hai tay (`fjf`, `jfk`...); khi đủ vốn phím, game chuyển sang từ tiếng Anh thật lọc từ ~2000 từ thông dụng. Bàn phím ảo dưới màn hình tô màu theo 8 ngón và highlight phím cần gõ tiếp theo.

## Tính năng

- Khóa mục tiêu theo chữ cái đầu, laser bắn theo từng phím đúng, particle nổ khi hạ tàu
- Thống kê realtime: điểm, WPM, độ chính xác, combo
- Âm thanh tổng hợp bằng Web Audio (không cần file asset)
- Tiến trình và kỷ lục từng level lưu trong `localStorage`
- `Esc` để quay về menu

## Cấu trúc

```
src/
├─ game/      # vòng lặp game, scene, tàu, laser, vụ nổ
├─ typing/    # xử lý phím, khóa mục tiêu, thống kê WPM
├─ lessons/   # giáo trình level, danh sách từ, sinh từ theo phím đã học
├─ ui/        # HUD, bàn phím ảo, các màn hình menu/kết quả
├─ audio/     # hiệu ứng âm thanh Web Audio
└─ storage/   # lưu tiến trình localStorage
```
