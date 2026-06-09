package com.festival.waiting.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Slf4j
@Service
public class FileStorageService {

    private final Path fileStorageLocation;

    public FileStorageService() {
        // 프로젝트 루트 폴더에 'uploads' 디렉토리 생성 및 바인딩
        this.fileStorageLocation = Paths.get("./uploads").toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (IOException e) {
            log.error("업로드 디렉토리를 생성할 수 없습니다.", e);
        }
    }

    public String storeFile(MultipartFile file) {
        String originalFileName = file.getOriginalFilename();
        String fileExtension = "";
        if (originalFileName != null && originalFileName.contains(".")) {
            fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
        }

        // 중복을 막기 위해 고유한 UUID 기반 파일네임 생성
        String fileName = UUID.randomUUID().toString() + fileExtension;

        try {
            if (fileName.contains("..")) {
                throw new IllegalArgumentException("파일명에 부적절한 상대경로 기호가 포함되어 있습니다: " + fileName);
            }

            Path targetLocation = this.fileStorageLocation.resolve(fileName);
            Files.copy(file.getInputStream(), targetLocation);

            log.info("[파일 저장 성공] 파일명: {}, 절대경로: {}", fileName, targetLocation);

            // 정적 리소스로 다운로드할 수 있는 상대 주소 반환
            return "/uploads/" + fileName;
        } catch (IOException ex) {
            throw new RuntimeException("파일 저장 오류: " + fileName, ex);
        }
    }
}
