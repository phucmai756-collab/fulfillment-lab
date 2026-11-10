# Fulfillment Lab

Mô hình kho fulfillment giả định phục vụ bài thuyết trình, không phải mặt bằng hay số liệu nội bộ Shopee.

## Liên hệ với tiểu luận

Ghi chú dựa trên cuộc trò chuyện **Ghi nhớ góp ý đề tài**. Fulfillment Lab là sản phẩm mô phỏng của tiểu luận Quản trị kho hàng và tồn kho. Bộ dữ liệu giả định PA0–PA3 của nhóm cung cấp nhân lực, thời gian xử lý và mức biến động đầu vào. Website dùng các thông số này để quan sát diễn biến của đơn hàng theo thời gian, từ đó giải thích điểm nghẽn và so sánh các phương án.

| Nội dung trong tiểu luận | Cách minh họa trên website |
|---|---|
| Hiện trạng mùa cao điểm | Chọn PA0 và kịch bản **Mùa cao điểm** ở 320 đơn/giờ. Packing có công suất lý thuyết 330 đơn/giờ, tương ứng tỷ lệ tải lý thuyết 320/330 ≈ 96,97%. |
| Điểm nghẽn và hàng chờ | **Demo 1** giữ tải 420 đơn/giờ để thấy tình trạng quá tải. Picking nhận toàn bộ nhu cầu nên có thể có hàng chờ dài hơn. Packing có công suất thấp nhất nên giới hạn sản lượng của cả dòng. |
| Tăng tải trong thời gian ngắn | **Demo 2** minh họa Flash Sale ở 420 đơn/giờ trong 3 giờ rồi trở về mức 320 đơn/giờ mặc định. Theo dõi backlog trước và sau khi tải giảm. |
| Hiệu quả các phương án | Đặt kịch bản **Mùa cao điểm** trước khi chạy **Demo 3** để so sánh PA0–PA3 ở cùng mức 320 đơn/giờ. Công suất giới hạn lần lượt là 330, 347,37, 380 và 360 đơn/giờ. Ở PA2, điểm nghẽn chuyển sang Picking. |
| Điều phối theo điểm nghẽn | **Demo 4** minh họa PA2 với Picking là Drum. Buffer tham chiếu 95 đơn tương đương 15 phút công suất Picking. Rope giữ một phần đơn ở đầu dòng để điều tiết lượng việc đã giải phóng. |

Khi đưa kết quả vào bài, ghi rõ phương án, nhu cầu, thời lượng, chế độ và seed. Bảng CT/WIP tham chiếu tại 320 đơn/giờ lấy từ mô hình hàng đợi xấp xỉ của tiểu luận. Số liệu website đến từ lượt mô phỏng và cần ghi riêng. SLA 24 giờ đo thời gian từ tiếp nhận đơn đến hoàn tất xuất kho. Các kết luận áp dụng trong phạm vi kho giả định của nhóm.

## Cài đặt

Yêu cầu Node.js 20 trở lên.

```sh
npm install
npm run dev
npm test
npm run build
```

Mở URL Vite hiển thị. Source chính gồm `src/engine.ts` (dữ liệu PA0–PA3 và engine), `src/main.tsx` (dashboard), `src/style.css` (Tailwind và giao diện), `src/engine.test.ts` (kiểm thử).

## Engine và giả định

Bước thời gian tối đa 0,1 phút. Mỗi đơn có ID, nhóm hàng, thời điểm đến, công đoạn hiện tại, bắt đầu xử lý công đoạn gần nhất, kết thúc, trạng thái và hạn SLA. FIFO tại mỗi công đoạn, mỗi nhân viên phục vụ tối đa một việc. Mỗi lần chuyển công đoạn lấy thời gian xử lý mới. Mô hình ngẫu nhiên dùng lognormal với mean và CV cấu hình, thời gian luôn dương. Bộ sinh LCG có seed cố định. Tất định dùng đúng giá trị trung bình. Sai số thời điểm chuyển công đoạn tối đa khoảng một bước mỗi lần chuyển.

Luồng bổ sung Inbound → Putaway → Storage độc lập với đơn khách Storage → Picking → Packing → Outbound. Nguồn hàng có sẵn được giả định đủ, bổ sung chỉ là số đơn vị công việc tương đương, không trừ tồn SKU. Kệ A/B/C minh họa nhóm hàng, không có tối ưu đường đi hoặc thiếu hàng. Ô cam đại diện việc đang xử lý, vị trí thay đổi theo phần thời gian xử lý còn lại. Không mô phỏng thời gian vận chuyển riêng.

Kịch bản ba ngày chạy 72 giờ lịch với ba ca 8 giờ, công việc dở dang tạm ngừng qua đêm và tiếp tục ở ca sau. Khách mới chỉ đến trong ca. SLA 24 giờ lịch vẫn chạy qua đêm. Tồn đầu kỳ 400 đơn tuổi 12 giờ. Đơn hoàn thành sau hạn vẫn được xuất và được ghi nhận trễ.

DBR dùng Drum là công đoạn công suất thấp nhất của dòng đơn. Rope giới hạn tổng WIP đã giải phóng ở mức 15 phút công suất Drum cộng số nhân viên dòng đơn. Các đơn còn lại chờ ngoài Picking, vẫn tính backlog và SLA. Buffer thực đo ở hàng chờ trước Drum. 95 và 76 là mức tham chiếu PA2, không phải tối ưu đã kiểm chứng. Quy tắc này không đảm bảo queue Drum luôn ở mục tiêu.

Throughput tích lũy chia theo giờ làm việc. Utilization là thời gian bận / nhân lực / thời gian ca đã trôi qua. CT và SLA tỷ lệ chỉ tính đơn đã hoàn tất. Số đơn chưa xong quá hạn được báo riêng. WIP và backlog có cùng phạm vi toàn hệ thống, gồm Rope. Chi phí tính giờ làm việc, chưa gồm đầu tư cố định. Biểu đồ giờ lấy mẫu tại các mốc giờ và trạng thái cuối. Kết quả tiểu luận hiển thị riêng, không dùng để hiệu chỉnh kết quả engine.

## Bốn demo

1. Điểm nghẽn Packing chạy PA0 với 420 đơn/giờ. Theo dõi hàng chờ, chọn công đoạn và chỉnh nhân lực, hoặc đổi PA để chạy lại từ đầu.
2. Flash Sale chạy 420 đơn/giờ trong 3 giờ rồi về 320. Chỉnh thời lượng và mức trở về ở bảng cấu hình.
3. So sánh PA0–PA3 chạy cả bốn từ đầu cùng kịch bản, seed và chế độ. CV và thời gian khác nhau theo từng phương án gốc. Bảng và biểu đồ thể hiện sản lượng thực nghiệm, bên dưới có CT/WIP tiểu luận.
4. DBR chạy PA2 ở tải 420. Quan sát Rope và buffer trước Picking, tắt DBR để chạy lại đối chứng.

Tốc độ 1× tương ứng một phút mô phỏng mỗi giây, 100× là 100 phút mỗi giây. Nút Chạy đến cuối phục vụ thí nghiệm nhanh. Đổi cấu hình luôn reset. Lưu/Nạp dùng localStorage. CSV xuất mẫu chỉ tiêu theo giờ. PNG dùng html-to-image. Trình chiếu dùng fullscreen và ẩn bảng cấu hình.

## Giới hạn

Không có di chuyển vật lý giữa các khu, hàng tồn SKU, nghỉ cá nhân, sự cố thiết bị hoặc chi phí đầu tư. Các biến ngẫu nhiên độc lập. Cùng seed giúp tái lập nhưng các phương án có thể tiêu thụ chuỗi ngẫu nhiên khác nhau khi số lần phục vụ khác nhau. So sánh chạy tất cả bốn phương án. Mô hình dùng bước thời gian thay vì hàng đợi sự kiện liên tục.

## Kết quả kiểm tra bàn giao

`npm run build` thành công. `npm test` đạt 6/6 nhóm kiểm thử bao phủ công suất bốn phương án, nhân lực, bảo toàn công việc, giới hạn nguồn lực, ca làm, SLA, quá tải, giải phóng backlog và tái lập seed. Đã sửa sai số số thực ở ranh giới ca bằng làm tròn đồng hồ đến 1e-8 phút.

Chưa kiểm tra trực quan bằng trình duyệt. npm install báo 3 cảnh báo bảo mật dependency (1 moderate, 2 critical), cần kiểm tra lại bằng npm audit khi có kết nối registry ổn định. Build có cảnh báo bundle lớn hơn 500 kB.
