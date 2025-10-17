# Sử dụng Node.js phiên bản 20 làm base image
FROM node:20

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Sao chép file package.json và package-lock.json (nếu có)
COPY package*.json ./

# Cài đặt dependencies
RUN npm install

# Sao chép toàn bộ mã nguồn vào container
COPY . .

# Mở cổng 5173 (port cho frontend Vite dev server)
EXPOSE 5173

# Lệnh khởi động ứng dụng Vite
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]