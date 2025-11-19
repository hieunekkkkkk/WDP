# Sử dụng Node.js phiên bản 20 làm base image
FROM node:20

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Sao chép file package.json và package-lock.json (nếu có)
COPY package*.json ./

# Cài đặt dependencies
RUN npm install --legacy-peer-deps

# Sao chép toàn bộ mã nguồn vào container
COPY . .

# Mở cổng 3000 (cổng mà ứng dụng Node.js chạy)
EXPOSE 3000

# Lệnh khởi động ứng dụng
CMD ["node", "server.js"]