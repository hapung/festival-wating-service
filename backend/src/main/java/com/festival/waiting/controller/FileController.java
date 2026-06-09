package com.festival.waiting.controller;

import com.festival.waiting.service.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@Tag(name = "이미지 업로드 API", description = "부스 및 메뉴 사진 업로드를 지원합니다.")
@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileStorageService fileStorageService;

    @Operation(summary = "부스/메뉴 이미지 업로드", description = "MultipartFile 이미지를 업로드하고 브라우저에서 접근 가능한 정적 URL 주소를 반환합니다.")
    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadFile(@RequestParam("file") MultipartFile file) {
        String fileUrl = fileStorageService.storeFile(file);
        Map<String, String> response = new HashMap<>();
        response.put("imageUrl", fileUrl);
        return ResponseEntity.ok(response);
    }
}
